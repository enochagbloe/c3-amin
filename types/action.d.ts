interface AuthCredentials {
  name?: string;
  username?: string;
  email: string;
  password: string;
  image?: string;
}

interface SignInWithOAuthParams {
  provider: "github" | "google";
  providerAccountId: string;
  user: {
    email: string;
    name: string;
    image: string;
    username: string;
  };
}