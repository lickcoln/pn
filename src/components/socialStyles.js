import { InstagramIcon, YoutubeIcon, SpotifyIcon, SoundCloudIcon } from './SocialIcons'

// Icon and brand colour for each channel returned by socialChannels() in lib/contactInfo.js
export const SOCIAL_STYLES = {
  instagram: { Icon: InstagramIcon, iconClass: 'text-pink-500', hoverClass: 'hover:border-pink-600/70 hover:text-pink-400' },
  spotify: { Icon: SpotifyIcon, iconClass: 'text-green-500', hoverClass: 'hover:border-green-600/70 hover:text-green-400' },
  youtube: { Icon: YoutubeIcon, iconClass: 'text-red-500', hoverClass: 'hover:border-red-600/70 hover:text-red-400' },
  soundcloud: { Icon: SoundCloudIcon, iconClass: 'text-orange-500', hoverClass: 'hover:border-orange-600/70 hover:text-orange-400' }
}
