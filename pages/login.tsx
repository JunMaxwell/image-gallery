import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Button, Input, Form, message, Alert } from 'antd';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (session) {
    router.push('/');
    return null;
  }

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    const result = await signIn('credentials', {
      redirect: false,
      email: values.email,
      password: values.password,
    });

    if (result?.error) {
      message.error(result.error);
    } else {
      message.success('Login successful');
      router.push('/');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <h1 className="login-title">Login</h1>
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} className="login-submit-button">
              Log in
            </Button>
          </Form.Item>
        </Form>

        <Alert
          message="Mock User Credentials"
          description={
            <div>
              <p>Admin: admin@example.com / admin123</p>
              <p>User: user@example.com / user123</p>
            </div>
          }
          type="info"
          showIcon
        />
      </div>
    </div>
  );
}