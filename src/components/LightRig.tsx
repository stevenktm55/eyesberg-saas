'use client';

import React from 'react';

export function LightRig() {
  return (
    <>
      {/* Éclairage professionnel type studio photo (identique au viewer 3D) */}
      {/* Ambiante douce */}
      <ambientLight intensity={0.4} color="#f5f5f5" />

      {/* Key */}
      <directionalLight position={[12, 18, 12]} intensity={2.0} color="#ffffff" castShadow={false} />
      {/* Fill */}
      <directionalLight position={[-8, 12, 8]} intensity={1.0} color="#f8f8ff" />
      {/* Back/Rim */}
      <directionalLight position={[0, 8, -15]} intensity={1.2} color="#fafafa" />
      {/* Side lights */}
      <directionalLight position={[20, 2, 0]} intensity={0.7} color="#ffffff" />
      <directionalLight position={[-20, 2, 0]} intensity={0.7} color="#ffffff" />
      {/* Top */}
      <directionalLight position={[0, 25, 0]} intensity={0.6} color="#ffffff" />
      {/* Accents */}
      <pointLight position={[5, 15, 8]} intensity={1.5} distance={40} decay={1.8} color="#ffffff" />
      <pointLight position={[-5, 12, 8]} intensity={1.2} distance={40} decay={1.8} color="#f8f9fa" />
      {/* Kicker */}
      <spotLight position={[0, -5, 10]} intensity={0.8} angle={Math.PI / 4} penumbra={0.5} color="#fafafa" />
    </>
  );
}



