// The active plugins in database
export type ActivePlugins = "tips" | "tokens" | "bullmeter";

// The social media platforms in database
export type SocialMedias = "youtube" | "twitch" | "x";

// The social media urls in database
export type SocialMediaUrls = {
  [key in SocialMedias]: string;
};
