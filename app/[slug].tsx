// app/[slug].tsx
import { Redirect, useLocalSearchParams } from "expo-router";

export default function SlugRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  return (
    <Redirect
      href={{
        pathname: "/(tabs)/(home)",
        params: { code: slug }, // <-- important: Home reads `code`
      }}
    />
  );
}
