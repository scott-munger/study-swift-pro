import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Clock } from 'lucide-react';

interface TimerProps {
  duration: number; // en secondes
  onTimeUp: () => void;
  className?: string;
}

const Timer: React.FC<TimerProps> = ({ duration, onTimeUp, className = "" }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setIsActive(false);
            onTimeUp();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, timeLeft, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / duration) * 100;

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Clock className="w-5 h-5 text-primary" />
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-foreground">
            Temps restant
          </span>
          <span className={`text-sm font-bold ${
            timeLeft <= 10 ? 'text-red-600' : 
            timeLeft <= 30 ? 'text-yellow-600' : 
            'text-primary'
          }`}>
            {formatTime(timeLeft)}
          </span>
        </div>
        <Progress 
          value={progress} 
          className={`h-2 ${
            timeLeft <= 10 ? '[&>div]:bg-red-500' : 
            timeLeft <= 30 ? '[&>div]:bg-yellow-500' : 
            '[&>div]:bg-primary'
          }`}
        />
      </div>
    </div>
  );
};

export default Timer;


