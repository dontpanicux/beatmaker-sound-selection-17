import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import svgPaths from '../imports/svg-9daivwmx0y';
import { BeatGrid } from './components/BeatGrid';
import { AudioEngine } from './components/AudioEngine';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { SaveBeatModal } from './components/SaveBeatModal';
import { LoadBeatModal } from './components/LoadBeatModal';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { getSupabaseClient } from './utils/supabase';

const TRACKS = ['Kick', 'Snare', 'Open Hi-hat', 'Closed Hi-hat', 'Clap'];
const STEPS = 16;

export default function App() {
  const [tempo, setTempo] = useState(120);
  const [tempoInput, setTempoInput] = useState('120');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [pattern, setPattern] = useState<boolean[][]>(
    Array(TRACKS.length).fill(null).map(() => Array(STEPS).fill(false))
  );
  
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('login');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [profilePhotoLoading, setProfilePhotoLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check for existing session on load
  useEffect(() => {
    checkSession();
  }, []);

  const loadProfilePhoto = async () => {
    if (!accessToken) return;

    setProfilePhotoLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e44554cb/profile/photo`,
        {
          headers: {
            // Send publicAnonKey in Authorization header for Supabase infrastructure
            'Authorization': `Bearer ${publicAnonKey}`,
            // Send user's actual token in custom header for our server to verify
            'X-Access-Token': accessToken
          }
        }
      );

      if (!response.ok) {
        // 401 means not authenticated - this is expected if token isn't ready yet
        if (response.status === 401) {
          return;
        }
        
        // 404 or other errors
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load profile photo:', response.status, errorData);
        return;
      }

      const data = await response.json();
      if (data.photoUrl) {
        setProfilePhotoUrl(data.photoUrl);
      }
    } catch {
      // Silently ignore - user may not have a photo yet or token may not be ready
    } finally {
      setProfilePhotoLoading(false);
    }
  };

  // Load profile photo when user logs in
  useEffect(() => {
    if (accessToken && user) {
      loadProfilePhoto();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, user]);

  const checkSession = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setAccessToken(session.access_token);
        setUser(session.user);
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  };

  const handleAuthSuccess = (token: string, authUser: any) => {
    setAccessToken(token);
    setUser(authUser);
  };

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      setAccessToken(null);
      setUser(null);
      setProfilePhotoUrl(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSaveBeat = async (beatName: string) => {
    if (!accessToken) {
      toast.error('Please log in to save beats');
      setShowAuthModal(true);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e44554cb/beats/save`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Send publicAnonKey in Authorization header for Supabase infrastructure
            'Authorization': `Bearer ${publicAnonKey}`,
            // Send user's actual token in custom header for our server to verify
            'X-Access-Token': accessToken
          },
          body: JSON.stringify({
            beatName,
            pattern,
            tempo
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save beat');
      }

      toast.success(`Beat "${beatName}" saved successfully!`);
      setShowSaveModal(false);
    } catch (error: any) {
      console.error('Save beat error:', error);
      toast.error(error.message || 'Failed to save beat');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadBeat = (loadedPattern: boolean[][], loadedTempo: number) => {
    setPattern(loadedPattern);
    setTempo(loadedTempo);
    setTempoInput(loadedTempo.toString());
    setIsPlaying(false);
  };

  const handleCellToggle = (trackIndex: number, stepIndex: number) => {
    setPattern(prev => {
      const newPattern = prev.map(row => [...row]);
      newPattern[trackIndex][stepIndex] = !newPattern[trackIndex][stepIndex];
      return newPattern;
    });
  };

  const handleTempoChange = (value: string) => {
    setTempoInput(value);
    const newTempo = parseInt(value);
    if (!isNaN(newTempo) && newTempo >= 40 && newTempo <= 240) {
      setTempo(newTempo);
    }
  };

  const handleTempoBlur = () => {
    const newTempo = parseInt(tempoInput);
    if (isNaN(newTempo) || newTempo < 40 || newTempo > 240) {
      setTempoInput(tempo.toString());
    }
  };

  const handleNewBeat = () => {
    setPattern(Array(TRACKS.length).fill(null).map(() => Array(STEPS).fill(false)));
    setIsPlaying(false);
  };

  const handleSaveClick = () => {
    if (!accessToken) {
      toast.error('Please log in to save beats');
      setAuthMode('login');
      setShowAuthModal(true);
    } else {
      setShowSaveModal(true);
    }
  };

  const handleLoadClick = () => {
    if (!accessToken) {
      toast.error('Please log in to load beats');
      setAuthMode('login');
      setShowAuthModal(true);
    } else {
      setShowLoadModal(true);
    }
  };

  const handleSignUpClick = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleLogInClick = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === 'Escape') {
        setIsPlaying(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTempoStep = (delta: number) => {
    const newTempo = Math.min(240, Math.max(40, tempo + delta));
    setTempo(newTempo);
    setTempoInput(newTempo.toString());
  };

  return (
    <div className="min-h-screen w-full bg-[#09090b] overflow-auto flex flex-col">
      <Navbar
        onSignUpClick={handleSignUpClick}
        onLogInClick={handleLogInClick}
        user={user}
        onLogout={handleLogout}
        profilePhotoUrl={profilePhotoUrl}
        profilePhotoLoading={profilePhotoLoading}
        accessToken={accessToken}
        onPhotoUploaded={setProfilePhotoUrl}
      />
      
      <div className="flex-1 flex flex-col items-center px-[40px] py-[40px] gap-[0px]">
        {/* Playback Tools */}
        <div className="bg-[#18181b] relative rounded-tl-[12px] rounded-tr-[12px] shrink-0 w-full max-w-[1200px]">
          <div className="overflow-clip rounded-[inherit] size-full">
            <div className="content-stretch flex items-start justify-between px-[40px] py-[16px] relative w-full">
              {/* Left side controls */}
              <div className="content-stretch flex gap-[40px] items-center relative shrink-0">
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                  <p className="font-['Inter:Medium',sans-serif] font-medium leading-[normal] not-italic relative shrink-0 text-[#f1f5f9] text-[16px]">Tempo</p>
                  <div className="bg-[#27272a] content-stretch flex items-center rounded-[2px] shrink-0 border border-[#3f3f47]">
                    <button
                      type="button"
                      onClick={() => handleTempoStep(-5)}
                      className="px-2 py-1 text-[#9f9fa9] hover:text-[#f1f5f9] font-medium"
                      aria-label="Decrease tempo"
                    >
                      −
                    </button>
                    <input
                      type="text"
                      value={tempoInput}
                      onChange={(e) => handleTempoChange(e.target.value)}
                      onBlur={handleTempoBlur}
                      className="font-['Inter:Medium',sans-serif] font-medium leading-[normal] not-italic relative shrink-0 text-[#f1f5f9] text-[16px] bg-transparent border-none outline-none w-[50px] text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleTempoStep(5)}
                      className="px-2 py-1 text-[#9f9fa9] hover:text-[#f1f5f9] font-medium"
                      aria-label="Increase tempo"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-[#8200db] content-stretch flex gap-[4px] items-center justify-center p-[8px] relative rounded-[8px] shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <div aria-hidden="true" className="absolute border border-[#ad46ff] border-solid inset-0 pointer-events-none rounded-[8px]" />
                  <div className="overflow-clip relative shrink-0 size-[20px]">
                    <div className="absolute inset-[12.5%]">
                      <div className="absolute inset-[-5%]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.5 16.5">
                          <g>
                            <path d={svgPaths.p3031a300} stroke="var(--stroke-0, #F8FAFC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                            <path d={svgPaths.p2aad7200} stroke="var(--stroke-0, #F8FAFC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className="font-['Geist:Medium',sans-serif] font-medium leading-[normal] relative shrink-0 text-[#f8fafc] text-[16px]">
                    {isPlaying ? 'Stop' : 'Playback'}
                  </p>
                </button>
              </div>

              {/* Right side controls */}
              <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
                <button 
                  onClick={handleLoadClick}
                  className="content-stretch flex gap-[8px] items-center justify-center p-[8px] relative shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="bg-[#27272a] content-stretch flex items-center p-[4px] relative rounded-[4px] shrink-0">
                    <div aria-hidden="true" className="absolute border border-[#3f3f47] border-solid inset-0 pointer-events-none rounded-[4px]" />
                    <div className="overflow-clip relative rounded-[4px] shrink-0 size-[20px]">
                      <div className="absolute inset-[15.63%_7.68%]">
                        <div className="absolute inset-[-5.45%_-4.43%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.4272 15.25">
                            <path d={svgPaths.p14df6180} stroke="var(--stroke-0, #99A1AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="font-['Geist:Medium',sans-serif] font-medium leading-[normal] relative shrink-0 text-[#f1f5f9] text-[16px]">Open Beat</p>
                </button>
                <button 
                  onClick={handleSaveClick}
                  className="content-stretch flex gap-[8px] items-center justify-center p-[8px] relative shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="bg-[#27272a] content-stretch flex items-center p-[4px] relative rounded-[4px] shrink-0">
                    <div aria-hidden="true" className="absolute border border-[#3f3f47] border-solid inset-0 pointer-events-none rounded-[4px]" />
                    <div className="overflow-clip relative rounded-[4px] shrink-0 size-[20px]">
                      <div className="absolute inset-[18.75%_9.38%]">
                        <div className="absolute inset-[-6%_-4.62%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.75 14">
                            <path d={svgPaths.pb0ea00} stroke="var(--stroke-0, #99A1AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="font-['Geist:Medium',sans-serif] font-medium leading-[normal] relative shrink-0 text-[#f1f5f9] text-[16px]">Save Beat</p>
                </button>
                <button
                  onClick={handleNewBeat}
                  className="content-stretch flex gap-[8px] items-center justify-center p-[8px] relative shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="bg-[#27272a] content-stretch flex items-center p-[4px] relative rounded-[4px] shrink-0">
                    <div aria-hidden="true" className="absolute border border-[#3f3f47] border-solid inset-0 pointer-events-none rounded-[4px]" />
                    <div className="overflow-clip relative rounded-[4px] shrink-0 size-[20px]">
                      <div className="absolute inset-[9.38%_15.63%]">
                        <div className="absolute inset-[-4.62%_-5.45%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.25 17.75">
                            <path d={svgPaths.p2543cf1} stroke="var(--stroke-0, #99A1AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="font-['Geist:Medium',sans-serif] font-medium leading-[normal] relative shrink-0 text-[#f1f5f9] text-[16px]">New Beat</p>
                </button>
              </div>
            </div>
          </div>
          <div aria-hidden="true" className="absolute border-2 border-[#3f3f47] border-solid inset-0 pointer-events-none rounded-tl-[12px] rounded-tr-[12px]" />
        </div>

        {/* Beat Grid Container */}
        <div className="bg-[#18181b] relative rounded-bl-[12px] rounded-br-[12px] shrink-0 w-full max-w-[1200px] border-2 border-t-0 border-[#3f3f47]">
          <div className="overflow-clip rounded-[inherit] size-full">
            <div className="px-[40px] py-[32px]">
              <BeatGrid
                tracks={TRACKS}
                steps={STEPS}
                isPlaying={isPlaying}
                currentStep={currentStep}
                onCellToggle={handleCellToggle}
                pattern={pattern}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Audio Engine */}
      <AudioEngine
        isPlaying={isPlaying}
        tempo={tempo}
        pattern={pattern}
        tracks={TRACKS}
        onStepChange={setCurrentStep}
      />

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
        authMode={authMode}
        setAuthMode={setAuthMode}
        initialMode={authMode}
      />

      <SaveBeatModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveBeat}
        isSaving={isSaving}
      />

      <LoadBeatModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        onLoad={handleLoadBeat}
        accessToken={accessToken}
      />
    </div>
  );
}