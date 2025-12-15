/**
 * Loading Tips
 *
 * Helpful tips shown to users while AI is generating their app.
 */

export const LOADING_TIPS = [
  "Sign in to save your apps to the cloud",
  "Browse templates in the App Store",
  "Edit your app by describing changes",
  "Try the Christmas theme in Settings",
  "Long press app icon to delete",
  "We're open source on GitHub",
]

/**
 * Get a random tip from the list
 */
export const getRandomTip = () => {
  return LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)]
}
