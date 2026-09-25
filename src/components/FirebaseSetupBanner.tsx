import React from 'react';
import { ShieldAlert, Key, Database, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const FirebaseSetupBanner: React.FC = () => {
  const { firebaseConfigured, missingKeys } = useAuth();

  if (firebaseConfigured) return null;

  return (
    <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 sm:p-5 mb-6 text-amber-200 backdrop-blur-md">
      <div className="flex items-start gap-3.5">
        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="flex-1 text-sm">
          <h4 className="font-bold text-amber-300 text-base mb-1">
            Firebase Backend Credentials Required
          </h4>
          <p className="text-amber-200/90 leading-relaxed mb-3">
            Real authentication and Firestore user profile persistence require your Firebase Admin service account details in the backend environment.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-black/40 p-3 rounded-lg border border-amber-500/20 mb-3">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>FIREBASE_PROJECT_ID</span>
              {missingKeys.includes('FIREBASE_PROJECT_ID') && (
                <span className="text-rose-400 ml-auto font-medium">[Required]</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>FIREBASE_CLIENT_EMAIL</span>
              {missingKeys.includes('FIREBASE_CLIENT_EMAIL') && (
                <span className="text-rose-400 ml-auto font-medium">[Required]</span>
              )}
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>FIREBASE_PRIVATE_KEY</span>
              {missingKeys.includes('FIREBASE_PRIVATE_KEY') && (
                <span className="text-rose-400 ml-auto font-medium">[Required]</span>
              )}
            </div>
          </div>

          <p className="text-xs text-amber-300/80">
            Please share your Firebase Service Account JSON or credentials in the chat to activate live sign up and log in.
          </p>
        </div>
      </div>
    </div>
  );
};
