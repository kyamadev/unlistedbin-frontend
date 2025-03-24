import { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface PasswordRequirementsProps {
  password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    setRequirements({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  const RequirementItem = ({ 
    satisfied, 
    text 
  }: { 
    satisfied: boolean; 
    text: string 
  }) => (
    <li className="flex items-center text-sm">
      {satisfied ? (
        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-gray-300 mr-2 flex-shrink-0" />
      )}
      <span className={satisfied ? 'text-green-700 dark:text-green-400' : 'text-gray-500'}>
        {text}
      </span>
    </li>
  );

  // すべての要件を満たしているかどうか
  const allSatisfied = Object.values(requirements).every(Boolean);

  return (
    <div className={`rounded-md p-3 space-y-2 bg-gray-50 dark:bg-gray-800 ${
      allSatisfied ? 'border border-green-200 dark:border-green-800' : ''
    }`}>
      <p className="text-sm font-medium">
        パスワード要件:
      </p>
      <ul className="space-y-1">
        <RequirementItem 
          satisfied={requirements.length} 
          text="8文字以上"
        />
        <RequirementItem 
          satisfied={requirements.uppercase} 
          text="大文字(A-Z)を1文字以上"
        />
        <RequirementItem 
          satisfied={requirements.lowercase} 
          text="小文字(a-z)を1文字以上"
        />
        <RequirementItem 
          satisfied={requirements.number} 
          text="数字(0-9)を1文字以上"
        />
        <RequirementItem 
          satisfied={requirements.special} 
          text="特殊文字(例: @#$%&*)を1文字以上"
        />
      </ul>
    </div>
  );
}