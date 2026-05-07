import { Config } from '@remotion/cli/config'

Config.setVideoImageFormat('jpeg')
Config.setOverwriteOutput(true)
Config.setConcurrency(4)
// Bonne qualité H.264 pour réseaux sociaux (Reels/TikTok recompressent de toute façon)
Config.setCrf(20)
Config.setPixelFormat('yuv420p')
