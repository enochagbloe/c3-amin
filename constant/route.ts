export const ROUTES = {
  HOME: "/",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  SIGN_IN_WITH_OAUTH: `signin-with-oauth`,
  PROFILE: (id: string) => `/profile/${id}`,
};
