import * as THREE from "three";
import { Suspense, useRef, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Preload, useTexture, ScrollControls, Scroll, useScroll, Html, useProgress } from "@react-three/drei";
import { Button, message, Upload, Modal, Input, List, Avatar } from 'antd';
import { UploadOutlined, DeleteOutlined, EditOutlined, LogoutOutlined } from '@ant-design/icons';
import type { RcFile, UploadProps } from 'antd/es/upload';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';

interface ImageProps {
  position: [number, number, number];
  scale: [number, number, number];
  url: string;
  onClick: () => void;
}

interface Comment {
  id: string;
  text: string;
  user: {
    name: string;
    email: string;
  };
  createdAt: Date;
}

interface ImageData {
  url: string;
  comments: Comment[];
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

function CommentSection({ comments, onAddComment, onEditComment, onDeleteComment, currentUser }: {
  comments: Comment[];
  onAddComment: (text: string) => void;
  onEditComment: (id: string, newText: string) => void;
  onDeleteComment: (id: string) => void;
  currentUser: { name: string; email: string };
}) {
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  const handleEditClick = (comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const handleEditSave = (id: string) => {
    if (editText.trim()) {
      onEditComment(id, editText.trim());
      setEditingId(null);
    }
  };

  return (
    <div style={{ marginTop: '20px', width: '100%' }}>
      <Input.TextArea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="Add a comment..."
        autoSize={{ minRows: 2, maxRows: 4 }}
      />
      <Button onClick={handleAddComment} style={{ marginTop: '10px' }}>Add Comment</Button>
      <List
        itemLayout="horizontal"
        dataSource={comments}
        renderItem={(comment) => (
          <List.Item
            actions={[
              comment.user.email === currentUser.email && (
                <>
                  <Button key="edit" icon={<EditOutlined />} onClick={() => handleEditClick(comment)} />
                  <Button key="delete" icon={<DeleteOutlined />} onClick={() => onDeleteComment(comment.id)} />
                </>
              )
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar src={`https://www.gravatar.com/avatar/${comment.user.email}?d=identicon&s=40`} />}
              title={comment.user.name}
              description={
                editingId === comment.id ? (
                  <>
                    <Input.TextArea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      autoSize={{ minRows: 2, maxRows: 4 }}
                    />
                    <Button onClick={() => handleEditSave(comment.id)}>Save</Button>
                  </>
                ) : (
                  comment.text
                )
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [images, setImages] = useState<ImageData[]>([
    { url: "/image1.jpeg", comments: [] },
    { url: "/image2.jpeg", comments: [] },
    { url: "/image3.jpeg", comments: [] },
    { url: "/image4.jpeg", comments: [] },
    { url: "/image5.jpeg", comments: [] },
    { url: "/image6.jpeg", comments: [] },
    { url: "/image7.jpeg", comments: [] },
    { url: "/image8.jpeg", comments: [] },
    { url: "/image9.jpeg", comments: [] },
    { url: "/image10.jpeg", comments: [] },
    { url: "/image11.jpeg", comments: [] },
    { url: "/image12.jpeg", comments: [] },
    { url: "/image13.jpeg", comments: [] },
    { url: "/image14.jpeg", comments: [] },
    { url: "/image15.jpeg", comments: [] },
  ]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleUpload = useCallback((file: RcFile) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        setImages(prevImages => [...prevImages, { url: e.target.result, comments: [] }]);
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

  const handleAddComment = useCallback((text: string) => {
    if (selectedImage && session?.user) {
      setImages(prevImages => prevImages.map(img => 
        img.url === selectedImage 
          ? { ...img, comments: [...img.comments, { id: Date.now().toString(), text, user: { name: session.user.name || '', email: session.user.email || '' }, createdAt: new Date() }] }
          : img
      ));
    }
  }, [selectedImage, session]);

  const handleEditComment = useCallback((id: string, newText: string) => {
    if (selectedImage) {
      setImages(prevImages => prevImages.map(img => 
        img.url === selectedImage 
          ? { ...img, comments: img.comments.map(comment => 
              comment.id === id ? { ...comment, text: newText } : comment
            )}
          : img
      ));
    }
  }, [selectedImage]);

  const handleDeleteComment = useCallback((id: string) => {
    if (selectedImage) {
      setImages(prevImages => prevImages.map(img => 
        img.url === selectedImage 
          ? { ...img, comments: img.comments.filter(comment => comment.id !== id) }
          : img
      ));
    }
  }, [selectedImage]);

  const handleLogout = useCallback(() => {
    signOut({ callbackUrl: '/login' });
  }, []);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
        <UploadButton onUpload={handleUpload} />
      </div>
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
        <Button icon={<LogoutOutlined />} onClick={handleLogout}>Logout</Button>
      </div>
      <Canvas gl={{ antialias: false }} dpr={[1, 1.5]}>
        <Suspense fallback={<Loader />}>
          <ScrollControls infinite horizontal damping={4} pages={Math.ceil(images.length / 3)} distance={1}>
            <Scroll>
              <Pages urls={images.map(img => img.url)} onImageClick={handleImageClick} />
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
            padding: 20, 
            height: '80vh', 
            maxHeight: '800px', 
            overflow: 'auto',
            borderRadius: '8px',
          },
          mask: { backdropFilter: 'blur(5px)' },
        }}
      >
        {selectedImage && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ 
              width: '100%',
              height: '60%',
              position: 'relative',
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <Image 
                src={selectedImage} 
                alt="Selected"
                fill
                style={{ 
                  objectFit: 'contain',
                  boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)'
                }} 
              />
            </div>
            <CommentSection 
              comments={images.find(img => img.url === selectedImage)?.comments || []}
              onAddComment={handleAddComment}
              onEditComment={handleEditComment}
              onDeleteComment={handleDeleteComment}
              currentUser={{ name: session.user?.name || '', email: session.user?.email || '' }}
            />
          </div>
        )}
      </Modal>
    </>
  );
}