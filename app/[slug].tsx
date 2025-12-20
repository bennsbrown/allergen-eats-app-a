import { Redirect, useLocalSearchParams } from "expo-router";

export default function SlugRoute() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();

  // Safety: if slug missing, go home
  if (!slug || typeof slug !== "string") {
    return <Redirect href="/" />;
  }

  // Redirect into your real home screen, passing the slug as `code`
  return (
    <Redirect
      href={{
        pathname: "/(tabs)/(home)",
        params: { code: slug },
      }}
    />
  );
}
