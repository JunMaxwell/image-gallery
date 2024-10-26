import * as THREE from "three";
import { Suspense, useRef, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Preload, useTexture, ScrollControls, Scroll, useScroll, Html, useProgress } from "@react-three/drei";
import { Button, message, Upload, Modal } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { RcFile, UploadProps } from 'antd/es/upload';

interface ImageProps {
  position: [number, number, number];
  scale: [number, number, number];
  url: string;
  onClick: () => void;
}

function Image3D({ position, scale, url, onClick }: ImageProps) {
  const ref = useRef<THREE.Mesh>(null);
  const group = useRef<THREE.Group>(null);
  const data = useScroll();
  const texture = useTexture(url);

  useFrame((state, delta) => {
    if (group.current && ref.current && ref.current.material) {
      group.current.position.z = THREE.MathUtils.damp(group.current.position.z, Math.max(0, data.delta * 50), 4, delta);
      (ref.current.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.damp(
        (ref.current.material as THREE.MeshBasicMaterial).opacity,
        Math.max(0.2, 1 - data.delta * 1000),
        4,
        delta
      );
    }
  });

  const material = useMemo(() => new THREE.MeshBasicMaterial({ map: texture, transparent: true }), [texture]);

  return (
    <group ref={group}>
      <mesh ref={ref} position={position} scale={scale} material={material} onClick={onClick}>
        <planeGeometry args={[1, 1]} />
      </mesh>
    </group>
  );
}

interface PageProps {
  m?: number;
  urls: string[];
  position?: [number, number, number];
  onImageClick: (url: string) => void;
}

function Page({ m = 0.4, urls, onImageClick, ...props }: PageProps) {
  const { width } = useThree((state) => state.viewport);
  const w = width < 10 ? 1.5 / 3 : 1 / 3;
  return (
    <group {...props}>
      {urls.map((url, index) => (
        <Image3D 
          key={index} 
          position={[(index - 1) * width * w, 0, index - 1]} 
          scale={[width * w - m * 2, 5, 1]} 
          url={url} 
          onClick={() => onImageClick(url)}
        />
      ))}
    </group>
  );
}

function Loader() {
  const { progress } = useProgress()
  if (progress !== 100) {
    return (
      <Html center>
        <div className="loader-div">{progress.toFixed()}% loaded</div>
      </Html>
    );
  }
  
  return null
}

function Pages({ urls, onImageClick }: { urls: string[], onImageClick: (url: string) => void }) {
  const { width } = useThree((state) => state.viewport);
  const pageUrls = useMemo(() => {
    const pages = [];
    for (let i = 0; i < urls.length; i += 3) {
      pages.push(urls.slice(i, i + 3));
    }
    return pages;
  }, [urls]);

  return (
    <>
      {pageUrls.map((pageUrl, index) => (
        <Page key={index} position={[width * index, 0, 0]} urls={pageUrl} onImageClick={onImageClick} />
      ))}
    </>
  );
}

function UploadButton({ onUpload }: { onUpload: (file: RcFile) => void }) {
  const props: UploadProps = {
    name: 'file',
    accept: 'image/*',
    beforeUpload: (file) => {
      onUpload(file);
      return false;
    },
    showUploadList: false,
  };

  return (
    <Upload {...props}>
      <Button icon={<UploadOutlined />}>Upload Image</Button>
    </Upload>
  );
}

export default function Home() {
  const [urls, setUrls] = useState<string[]>([
    "/image1.jpeg", "/image2.jpeg", "/image3.jpeg",
    "/image4.jpeg", "/image5.jpeg", "/image6.jpeg",
    "/image7.jpeg", "/image8.jpeg", "/image9.jpeg",
    "/image10.jpeg", "/image11.jpeg", "/image12.jpeg",
    "/image13.jpeg", "/image14.jpeg", "/image15.jpeg"
  ]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleUpload = useCallback((file: RcFile) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        setUrls(prevUrls => [...prevUrls, e.target.result]);
        message.success(`${file.name} file uploaded successfully`);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleImageClick = useCallback((url: string) => {
    setSelectedImage(url);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedImage(null);
  }, []);

  return (
    <>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
        <UploadButton onUpload={handleUpload} />
      </div>
      <Canvas gl={{ antialias: false }} dpr={[1, 1.5]}>
        <Suspense fallback={<Loader />}>
          <ScrollControls infinite horizontal damping={4} pages={Math.ceil(urls.length / 3)} distance={1}>
            <Scroll>
              <Pages urls={urls} onImageClick={handleImageClick} />
            </Scroll>
            <Scroll html>
              {/* Commented out HTML content */}
            </Scroll>
          </ScrollControls>
          <Preload all />
        </Suspense>
      </Canvas>
      <Modal
        open={selectedImage !== null}
        onCancel={handleCloseModal}
        footer={null}
        width="80%"
        style={{ maxWidth: '800px', top: '50%', transform: 'translateY(-50%)' }}
        styles={{
          body: { 
            padding: 0, 
            height: '60vh', 
            maxHeight: '600px', 
            overflow: 'hidden',
            borderRadius: '8px',
          },
          mask: { backdropFilter: 'blur(5px)' },
        }}
      >
        {selectedImage && (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            borderRadius: '8px',
          }}>
            <img 
              src={selectedImage} 
              alt="Selected" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                objectFit: 'contain',
                boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)'
              }} 
            />
          </div>
        )}
      </Modal>
    </>
  );
}