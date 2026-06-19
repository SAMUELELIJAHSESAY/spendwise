import { useEffect, useState, useRef } from 'react';
import { User, Camera, Edit3, Save, Trash2, Quote, Link as LinkIcon, Palette, Globe, Bell, Moon, Sun, Check, X, Briefcase, Target, Heart, Linkedin, Twitter, Instagram, Github, Award, Zap, TrendingUp, Calendar } from 'lucide-react';
import { storage, UserProfile, CURRENCIES } from '../../lib/storage';
import { useTheme } from '../../lib/theme';
import { generateId } from '../../lib/types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input, Select, Checkbox } from '../common/Input';
import { Modal } from '../common/Modal';

const THEME_COLORS = [
  { id: 'emerald', primary: '#10B981', accent: '#059669' },
  { id: 'blue', primary: '#3B82F6', accent: '#2563EB' },
  { id: 'purple', primary: '#8B5CF6', accent: '#7C3AED' },
  { id: 'rose', primary: '#F43F5E', accent: '#E11D48' },
  { id: 'amber', primary: '#F59E0B', accent: '#D97706' },
  { id: 'teal', primary: '#14B8A6', accent: '#0D9488' },
  { id: 'indigo', primary: '#6366F1', accent: '#4F46E5' },
  { id: 'pink', primary: '#EC4899', accent: '#DB2777' },
  { id: 'cyan', primary: '#06B6D4', accent: '#0891B2' },
  { id: 'lime', primary: '#84CC16', accent: '#65A30D' },
];

const SOCIAL_PLATFORMS = [
  { id: 'twitter', name: 'Twitter', icon: <Twitter className="w-4 h-4" />, placeholder: 'https://twitter.com/username' },
  { id: 'linkedin', name: 'LinkedIn', icon: <Linkedin className="w-4 h-4" />, placeholder: 'https://linkedin.com/in/username' },
  { id: 'instagram', name: 'Instagram', icon: <Instagram className="w-4 h-4" />, placeholder: 'https://instagram.com/username' },
  { id: 'github', name: 'GitHub', icon: <Github className="w-4 h-4" />, placeholder: 'https://github.com/username' },
  { id: 'website', name: 'Website', icon: <Globe className="w-4 h-4" />, placeholder: 'https://yourwebsite.com' },
];

interface ProfileFormState {
  displayName: string;
  bio: string;
  favoriteQuote: string;
  goals: string[];
  socialLinks: { platform: string; url: string }[];
  primaryColor: string;
  accentColor: string;
  occupation?: string;
  location?: string;
  joinDate?: string;
  interests?: string[];
}

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  const [activeLinkPlatform, setActiveLinkPlatform] = useState<string>('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { setColors } = useTheme();

  const [formState, setFormState] = useState<ProfileFormState>({
    displayName: '',
    bio: '',
    favoriteQuote: '',
    goals: [],
    socialLinks: [],
    primaryColor: '#10B981',
    accentColor: '#059669',
    occupation: '',
    location: '',
    joinDate: new Date().toISOString().split('T')[0],
    interests: [],
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await storage.getUserProfile();
      if (data) {
        setProfile(data);
        setFormState({
          displayName: data.displayName,
          bio: data.bio || '',
          favoriteQuote: data.favoriteQuote || '',
          goals: data.goals || [],
          socialLinks: data.socialLinks || [],
          primaryColor: data.theme.primaryColor,
          accentColor: data.theme.accentColor,
          occupation: (data as any).occupation || '',
          location: (data as any).location || '',
          joinDate: (data as any).joinDate || new Date().toISOString().split('T')[0],
          interests: (data as any).interests || [],
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const updatedProfile: UserProfile = {
        id: profile?.id || generateId(),
        userId: profile?.userId || 'user',
        displayName: formState.displayName || 'Student',
        bio: formState.bio,
        favoriteQuote: formState.favoriteQuote,
        goals: formState.goals,
        socialLinks: formState.socialLinks,
        theme: {
          primaryColor: formState.primaryColor,
          accentColor: formState.accentColor,
        },
        createdAt: profile?.createdAt || new Date(),
      };

      // Store additional fields
      const extendedProfile = {
        ...updatedProfile,
        occupation: formState.occupation,
        location: formState.location,
        joinDate: formState.joinDate,
        interests: formState.interests,
      };

      if (profile) {
        if (profile.avatarData) updatedProfile.avatarData = profile.avatarData;
        if (profile.coverImageData) updatedProfile.coverImageData = profile.coverImageData;
        await storage.updateUserProfile(updatedProfile);
      } else {
        await storage.createUserProfile(updatedProfile);
      }

      setProfile(updatedProfile);
      // Apply theme colors immediately
      setColors({
        primary: formState.primaryColor,
        accent: formState.accentColor,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        if (profile) {
          const updated = { ...profile, avatarData: base64 };
          await storage.updateUserProfile(updated);
          setProfile(updated);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        if (profile) {
          const updated = { ...profile, coverImageData: base64 };
          await storage.updateUserProfile(updated);
          setProfile(updated);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.trim()) return;
    const updatedGoals = [...formState.goals, newGoal.trim()];
    setFormState({ ...formState, goals: updatedGoals });
    setNewGoal('');
    setIsGoalModalOpen(false);
  };

  const handleRemoveGoal = (index: number) => {
    const updatedGoals = formState.goals.filter((_, i) => i !== index);
    setFormState({ ...formState, goals: updatedGoals });
  };

  const handleAddInterest = async () => {
    if (!newInterest.trim()) return;
    const updatedInterests = [...formState.interests || [], newInterest.trim()];
    setFormState({ ...formState, interests: updatedInterests });
    setNewInterest('');
    setIsInterestModalOpen(false);
  };

  const handleRemoveInterest = (index: number) => {
    const updatedInterests = formState.interests?.filter((_, i) => i !== index) || [];
    setFormState({ ...formState, interests: updatedInterests });
  };

  const handleAddLink = async () => {
    if (!newLinkUrl.trim() || !activeLinkPlatform) return;
    const existingIndex = formState.socialLinks.findIndex(l => l.platform === activeLinkPlatform);
    let updatedLinks = [...formState.socialLinks];
    if (existingIndex >= 0) {
      updatedLinks[existingIndex] = { platform: activeLinkPlatform, url: newLinkUrl.trim() };
    } else {
      updatedLinks.push({ platform: activeLinkPlatform, url: newLinkUrl.trim() });
    }
    setFormState({ ...formState, socialLinks: updatedLinks });
    setNewLinkUrl('');
    setActiveLinkPlatform('');
    setIsLinkModalOpen(false);
  };

  const handleRemoveLink = (platform: string) => {
    const updatedLinks = formState.socialLinks.filter(l => l.platform !== platform);
    setFormState({ ...formState, socialLinks: updatedLinks });
  };

  const handleThemeChange = (theme: typeof THEME_COLORS[0]) => {
    setFormState({
      ...formState,
      primaryColor: theme.primary,
      accentColor: theme.accentColor,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Cover Image */}
      <div className="relative">
        <div
          className="h-40 sm:h-56 rounded-xl overflow-hidden bg-gradient-to-r from-emerald-400 to-teal-500"
          style={{
            backgroundImage: profile?.coverImageData ? `url(${profile.coverImageData})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {!profile?.coverImageData && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white/50 text-center">
                <Globe className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">Add a cover image</p>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => coverInputRef.current?.click()}
          className="absolute bottom-4 right-4 p-2 rounded-lg bg-black/30 hover:bg-black/50 text-white transition-colors"
        >
          <Camera className="w-5 h-5" />
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverChange}
        />
      </div>

      {/* Profile Header */}
      <div className="relative -mt-16 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          {/* Avatar */}
          <div className="relative">
            <div
              className="w-28 h-28 rounded-2xl border-4 border-white dark:border-gray-900 shadow-lg overflow-hidden bg-gray-200 dark:bg-gray-700"
              style={{
                backgroundImage: profile?.avatarData ? `url(${profile.avatarData})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!profile?.avatarData && (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-500">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 p-1.5 rounded-lg bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Name and Bio */}
          <div className="flex-1">
            {isEditing ? (
              <Input
                value={formState.displayName}
                onChange={(e) => setFormState({ ...formState, displayName: e.target.value })}
                placeholder="Your name"
                className="text-xl font-bold"
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile?.displayName || 'Your Name'}
              </h1>
            )}
            {isEditing ? (
              <textarea
                value={formState.bio}
                onChange={(e) => setFormState({ ...formState, bio: e.target.value })}
                placeholder="Write a short bio..."
                rows={2}
                className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm resize-none"
              />
            ) : (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {profile?.bio || 'Add a bio to tell others about yourself'}
              </p>
            )}
          </div>

          {/* Edit/Save Button */}
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="secondary"
                  icon={<X className="w-4 h-4" />}
                  onClick={() => {
                    setIsEditing(false);
                    loadProfile();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  icon={<Save className="w-4 h-4" />}
                  onClick={handleSave}
                >
                  Save
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                icon={<Edit3 className="w-4 h-4" />}
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Personal Info */}
      {(isEditing || formState.occupation || formState.location) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              {isEditing ? (
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Occupation</label>
                  <Input
                    value={formState.occupation || ''}
                    onChange={(e) => setFormState({ ...formState, occupation: e.target.value })}
                    placeholder="e.g., Student, Developer"
                    className="mt-1"
                  />
                </div>
              ) : (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Occupation</p>
                  <p className="text-gray-900 dark:text-white">{formState.occupation || 'Not specified'}</p>
                </div>
              )}
            </div>
          </Card>
          <Card>
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              {isEditing ? (
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Location</label>
                  <Input
                    value={formState.location || ''}
                    onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                    placeholder="e.g., Freetown, Sierra Leone"
                    className="mt-1"
                  />
                </div>
              ) : (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Location</p>
                  <p className="text-gray-900 dark:text-white">{formState.location || 'Not specified'}</p>
                </div>
              )}
            </div>
          </Card>
          <Card>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Member Since</p>
                <p className="text-gray-900 dark:text-white">
                  {formState.joinDate ? new Date(formState.joinDate).toLocaleDateString() : 'Today'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Quote */}
      {(profile?.favoriteQuote || isEditing) && (
        <Card className="border-l-4 border-emerald-500">
          <div className="flex items-start gap-3">
            <Quote className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-1" />
            {isEditing ? (
              <Input
                value={formState.favoriteQuote}
                onChange={(e) => setFormState({ ...formState, favoriteQuote: e.target.value })}
                placeholder="Add your favorite financial quote..."
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300 italic">
                "{profile?.favoriteQuote || 'A dollar saved is a dollar earned.'}"
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Interests */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-500" />
            Interests
          </h3>
          {isEditing && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsInterestModalOpen(true)}
            >
              Add Interest
            </Button>
          )}
        </div>
        {formState.interests && formState.interests.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            {isEditing ? 'Add your interests' : 'No interests set yet'}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {formState.interests?.map((interest, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm"
              >
                {interest}
                {isEditing && (
                  <button
                    onClick={() => handleRemoveInterest(index)}
                    className="ml-1 hover:opacity-70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Goals */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            Financial Goals
          </h3>
          {isEditing && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsGoalModalOpen(true)}
            >
              Add Goal
            </Button>
          )}
        </div>
        {formState.goals.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            {isEditing ? 'Add your financial goals' : 'No goals set yet'}
          </p>
        ) : (
          <div className="space-y-2">
            {formState.goals.map((goal, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: formState.primaryColor }}
                  />
                  <span className="text-gray-700 dark:text-gray-300">{goal}</span>
                </div>
                {isEditing && (
                  <button
                    onClick={() => handleRemoveGoal(index)}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Social Links */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-emerald-500" />
            Social Links
          </h3>
          {isEditing && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsLinkModalOpen(true)}
            >
              Add Link
            </Button>
          )}
        </div>
        {formState.socialLinks.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            {isEditing ? 'Add your social links' : 'No social links added'}
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {formState.socialLinks.map((link) => {
              const platform = SOCIAL_PLATFORMS.find(p => p.id === link.platform);
              return (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
                >
                  <span className="text-gray-600 dark:text-gray-400">
                    {platform?.icon || <Globe className="w-4 h-4" />}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{platform?.name || 'Link'}</span>
                  {isEditing && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveLink(link.platform);
                      }}
                      className="ml-1 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </a>
              );
            })}
          </div>
        )}
      </Card>

      {/* Theme Customization */}
      {isEditing && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-emerald-500" />
            Theme Colors
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Choose your accent color (applies instantly after saving)</p>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
            {THEME_COLORS.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme)}
                className={`relative w-12 h-12 rounded-xl overflow-hidden transition-transform hover:scale-110 ${
                  formState.primaryColor === theme.primary ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white' : ''
                }`}
              >
                <div className="absolute inset-0" style={{ backgroundColor: theme.primary }} />
                <div className="absolute bottom-0 right-0 w-6 h-6" style={{ backgroundColor: theme.accent }} />
                {formState.primaryColor === theme.primary && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="text-center">
          <Award className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Goals Met</p>
        </Card>
        <Card className="text-center">
          <Zap className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Achievements</p>
        </Card>
        <Card className="text-center">
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Books Read</p>
        </Card>
        <Card className="text-center">
          <Heart className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Streak Days</p>
        </Card>
      </div>

      {/* Add Goal Modal */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title="Add Financial Goal"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Goal"
            placeholder="e.g., Save NLe 10,000 for emergency fund"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()}
          />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setIsGoalModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" fullWidth onClick={handleAddGoal}>
              Add
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Interest Modal */}
      <Modal
        isOpen={isInterestModalOpen}
        onClose={() => setIsInterestModalOpen(false)}
        title="Add Interest"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Interest"
            placeholder="e.g., Investing, Budgeting, Trading"
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
          />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setIsInterestModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" fullWidth onClick={handleAddInterest}>
              Add
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Link Modal */}
      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => {
          setIsLinkModalOpen(false);
          setActiveLinkPlatform('');
          setNewLinkUrl('');
        }}
        title="Add Social Link"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Platform
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SOCIAL_PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => setActiveLinkPlatform(platform.id)}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                    activeLinkPlatform === platform.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-gray-600 dark:text-gray-400">{platform.icon}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{platform.name}</span>
                </button>
              ))}
            </div>
          </div>
          <Input
            label="URL"
            placeholder={SOCIAL_PLATFORMS.find(p => p.id === activeLinkPlatform)?.placeholder || 'https://...'}
            value={newLinkUrl}
            onChange={(e) => setNewLinkUrl(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setIsLinkModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" fullWidth onClick={handleAddLink} disabled={!activeLinkPlatform || !newLinkUrl}>
              Add
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
