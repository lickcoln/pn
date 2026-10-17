// The footer's "Admin login" link asks the admin portal to open with this window event
// (the portal also opens with Ctrl + Shift + A).
export const OPEN_ADMIN_EVENT = 'pn:open-admin'

export const requestAdminPortal = () => window.dispatchEvent(new Event(OPEN_ADMIN_EVENT))
