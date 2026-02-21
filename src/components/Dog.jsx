import React, { useEffect, useRef } from "react";
import * as THREE from "three"
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, useTexture, useAnimations, useProgress } from "@react-three/drei";
import { normalMap, sample, texture } from "three/tsl";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const Dog = () => {

  gsap.registerPlugin(useGSAP, ScrollTrigger);

  const model = useGLTF("/models/dog.drc.glb")

  useThree(({ camera, scene, gl }) => {
    camera.position.z = 0.55
    gl.toneMapping = THREE.ReinhardToneMapping
    gl.outputColorSpace = THREE.SRGBColorSpace
  })

  const { actions } = useAnimations(model.animations, model.scene)

  useEffect(() => {
    actions["Take 001"].play();
  }, [actions])


  const [normalMap] = (useTexture(["/dog_normals.jpg",]))
    .map(texture => {
      texture.flipY = false
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture
    })


  const [branchMap, branchNormalMap] = (useTexture(["/branches_diffuse.jpg", "/branches_normals.jpg"]))
    .map(texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture
    })


  const [matcap1, matcap2] = useTexture(["/matcap/mat-2.png", "/matcap/mat-5.png"
  ]).map(texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture
  })

  const material = useRef({
    uMatcapTexture1: { value: matcap1 },
    uMatcapTexture2: { value: matcap2 },
    uProgress: { value: 1.0 }
  })

  const dogMaterial = new THREE.MeshMatcapMaterial({
    normalMap: normalMap,
    matcap: matcap1
  })

  const branchMaterial = new THREE.MeshMatcapMaterial({
    normalMap: branchNormalMap,
    map: branchMap
  })

  function onBeforeCompile(shader) {

    shader.uniforms.uMatcapTexture1 = material.current.uMatcapTexture1
    shader.uniforms.uMatcapTexture2 = material.current.uMatcapTexture2
    shader.uniforms.uProgress = material.current.uProgress

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `
    #include <common>
    uniform sampler2D uMatcapTexture1;
    uniform sampler2D uMatcapTexture2;
    uniform float uProgress;
    `
    )

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <matcap_fragment>",
      `
    vec4 matcap1 = texture2D(uMatcapTexture1, vMatcapUv);
    vec4 matcap2 = texture2D(uMatcapTexture2, vMatcapUv);
    vec4 mixed = mix(matcap1, matcap2, uProgress);
    diffuseColor.rgb = mixed.rgb;
    `
    )
  }

  dogMaterial.onBeforeCompile = onBeforeCompile

  model.scene.traverse((child) => {
    if (child.name.includes("DOG")) {
      child.material = dogMaterial
    } else {
      child.material = branchMaterial
    }
  })

  const dogModel = useRef(model)


  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#section-1",
        endTrigger: "#section-3",
        start: "top top",
        end: "bottom bottom",
        markers: true,
        scrub: true
      }
    })
    tl
    .to(dogModel.current.scene.position, {
                z: "-=0.75",
                y: "+=0.1"
            })
            .to(dogModel.current.scene.rotation, {
                x: `+=${Math.PI / 15}`
            })
            .to(dogModel.current.scene.rotation, {
                y: `-=${Math.PI}`,

            }, "third")
            .to(dogModel.current.scene.position, {
                x: "-=0.5",
                z: "+=0.6",
                y: "-=0.05"
            }, "third")
  }, [])

  useEffect(() => {

  const el = document.querySelector(
    `.titles .item[img-title="tomorrowland"]`
  );

  if (!el) return;

  const handleEnter = () => {
    gsap.to(material.current.uProgress, {
      value: 0.0,
      duration: 3,
      onUpdate: () => {
    dogMaterial.needsUpdate = true
  }
    });
  };

  el.addEventListener("mouseenter", handleEnter);

  return () => {
    el.removeEventListener("mouseenter", handleEnter);
  };

}, []);

  return (
    <>
      <primitive object={model.scene} position={[0.25, -0.55, 0]} rotation={[0, Math.PI / 4, 0]} />
      <directionalLight intensity={10} color={0xFFFFFF} position={[0, 5, 5]}> </directionalLight>
    </>
  );
};

export default Dog;
