import { memo } from 'react';
import { User } from 'lucide-react';
import { ProfilePhotoUpload } from './ProfilePhotoUpload';

interface NavbarProps {
  onSignUpClick: () => void;
  onLogInClick: () => void;
  user: any;
  onLogout: () => void;
  profilePhotoUrl: string | null;
  profilePhotoLoading?: boolean;
  accessToken: string | null;
  onPhotoUploaded: (photoUrl: string) => void;
}

export const Navbar = memo(function Navbar({
  onSignUpClick,
  onLogInClick,
  user,
  onLogout,
  profilePhotoUrl,
  profilePhotoLoading = false,
  accessToken,
  onPhotoUploaded,
}: NavbarProps) {
  return (
    <div className="bg-[#18181b] relative shrink-0 w-full" data-name="Navbar">
      <div className="flex flex-row items-center justify-end overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center justify-end px-[40px] py-[24px] relative w-full">
          <div className="content-stretch flex gap-[8px] items-center justify-end relative shrink-0">
            {user ? (
              <>
                <div className="flex items-center justify-center size-[32px] rounded-full overflow-hidden bg-[#27272a] border border-[#3f3f47] shrink-0">
                  {profilePhotoLoading ? (
                    <div className="size-full animate-pulse bg-[#3f3f47]" />
                  ) : profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt="Profile"
                      className="size-full object-cover"
                    />
                  ) : (
                    <User className="size-[18px] text-[#99a1af]" />
                  )}
                </div>
                <p className="font-['Inter:Medium',sans-serif] font-medium leading-[normal] text-[#f1f5f9] text-[14px] mr-[8px]">
                  {user.user_metadata?.name || user.email}
                </p>
                {accessToken && (
                  <ProfilePhotoUpload
                    accessToken={accessToken}
                    onPhotoUploaded={onPhotoUploaded}
                  />
                )}
                <button
                  onClick={onLogout}
                  className="content-stretch flex gap-[8px] items-center justify-center p-[8px] relative shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <p className="font-['Geist:Medium',sans-serif] font-medium leading-[normal] relative shrink-0 text-[#f1f5f9] text-[16px]">
                    Log Out
                  </p>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onSignUpClick}
                  className="bg-[#8200db] content-stretch flex gap-[4px] items-center justify-center p-[8px] relative rounded-[8px] shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <div aria-hidden="true" className="absolute border border-[#ad46ff] border-solid inset-0 pointer-events-none rounded-[8px]" />
                  <p className="font-['Geist:Medium',sans-serif] font-medium leading-[normal] relative shrink-0 text-[#f8fafc] text-[16px]">
                    Sign Up
                  </p>
                </button>
                <button
                  onClick={onLogInClick}
                  className="content-stretch flex gap-[8px] items-center justify-center p-[8px] relative shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <p className="font-['Geist:Medium',sans-serif] font-medium leading-[normal] relative shrink-0 text-[#f1f5f9] text-[16px]">
                    Log In
                  </p>
                </button>
              </>
            )}
          </div>
          <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-[#8200db] content-stretch flex items-center justify-center left-1/2 px-[16px] py-[4px] top-[calc(50%+1px)]">
            <p className="font-['Inter:Black_Italic',sans-serif] font-black italic leading-[normal] relative shrink-0 text-[#f8fafc] text-[36px]">
              Super Beats
            </p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#3f3f47] border-b border-solid inset-0 pointer-events-none" />
    </div>
  );
});
