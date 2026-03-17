import { useState, useEffect, useCallback } from 'react';
import { X, Trash2 } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { toast } from 'sonner';

interface Beat {
  id: string;
  name: string;
  pattern: boolean[][];
  tempo: number;
  createdAt: string;
}

interface LoadBeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (pattern: boolean[][], tempo: number) => void;
  accessToken: string | null;
}

export function LoadBeatModal({ isOpen, onClose, onLoad, accessToken }: LoadBeatModalProps) {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [beatToDelete, setBeatToDelete] = useState<Beat | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadBeats = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e44554cb/beats`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'X-Access-Token': accessToken!,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load beats');
      }

      setBeats(data.beats || []);
    } catch (err: any) {
      console.error('Load beats error:', err);
      setError(err.message || 'Failed to load beats');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isOpen && accessToken) {
      loadBeats();
    }
  }, [isOpen, accessToken, loadBeats]);

  const handleDeleteClick = (beat: Beat) => {
    setBeatToDelete(beat);
  };

  const handleDeleteConfirm = async () => {
    if (!beatToDelete || !accessToken) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e44554cb/beats/${beatToDelete.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'X-Access-Token': accessToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete beat');
      }

      toast.success('Beat deleted');
      loadBeats();
    } catch (err: any) {
      console.error('Delete beat error:', err);
      toast.error(err.message || 'Failed to delete beat');
    } finally {
      setDeleting(false);
      setBeatToDelete(null);
    }
  };

  const handleLoadBeat = (beat: Beat) => {
    onLoad(beat.pattern, beat.tempo);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
        <div
          className="bg-[#18181b] rounded-[12px] p-[32px] w-[500px] max-h-[600px] border-2 border-[#3f3f47] relative flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-[16px] right-[16px] text-[#9f9fa9] hover:text-[#f1f5f9] transition-colors"
          >
            <X size={24} />
          </button>

          <h2 className="font-['Inter:Medium',sans-serif] font-medium text-[#f8fafc] text-[24px] mb-[24px]">
            Load Beat
          </h2>

          {loading ? (
            <p className="text-[#9f9fa9] font-['Inter:Medium',sans-serif] font-medium text-[16px]">
              Loading...
            </p>
          ) : error ? (
            <p className="text-red-500 font-['Inter:Medium',sans-serif] font-medium text-[16px]">
              {error}
            </p>
          ) : beats.length === 0 ? (
            <p className="text-[#9f9fa9] font-['Inter:Medium',sans-serif] font-medium text-[16px]">
              No saved beats yet. Create and save your first beat!
            </p>
          ) : (
            <div className="flex flex-col gap-[8px] overflow-y-auto max-h-[400px]">
              {beats.map((beat) => (
                <div
                  key={beat.id}
                  className="bg-[#27272a] border border-[#3f3f47] rounded-[8px] p-[16px] flex items-center justify-between hover:border-[#8200db] transition-colors"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handleLoadBeat(beat)}
                  >
                    <p className="font-['Inter:Medium',sans-serif] font-medium text-[#f1f5f9] text-[16px]">
                      {beat.name}
                    </p>
                    <p className="font-['Inter:Medium',sans-serif] font-medium text-[#9f9fa9] text-[12px] mt-[4px]">
                      {new Date(beat.createdAt).toLocaleDateString()} • {beat.tempo} BPM
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(beat);
                    }}
                    className="text-[#9f9fa9] hover:text-red-500 transition-colors p-[8px]"
                    aria-label={`Delete ${beat.name}`}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!beatToDelete} onOpenChange={(open) => !open && setBeatToDelete(null)}>
        <AlertDialogContent className="bg-[#18181b] border-[#3f3f47]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#f8fafc]">
              Delete beat?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#9f9fa9]">
              {beatToDelete
                ? `Are you sure you want to delete "${beatToDelete.name}"? This cannot be undone.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="bg-[#27272a] border-[#3f3f47] text-[#f1f5f9] hover:bg-[#3f3f46]"
            >
              Cancel
            </AlertDialogCancel>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
