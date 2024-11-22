import React from 'react';
import { Button } from '@/components/ui/Button';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      <div className="max-w-3xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          Deploy Node.js Apps with Ease
        </h1>
        <p className="mx-auto max-w-[700px] text-lg text-muted-foreground sm:text-xl">
          NodeRoll is your self-hosted solution for seamless Node.js application deployment.
          Scale, monitor, and manage your applications with confidence.
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg">Get Started</Button>
          <Button size="lg" variant="outline">Documentation</Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
