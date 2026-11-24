import { useEffect, useState } from "react";
import { StoreProvider, useStore } from "./store";
import { TeacherApp } from "./pages/Teacher";
import { StudentApp } from "./pages/Student";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";

function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const parts = raw.split("/").filter(Boolean);
  return parts;
}

function useRoute() {
  const [parts, setParts] = useState<string[]>(parseHash);
  useEffect(() => {
    const onChange = () => setParts(parseHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return parts;
}

export function navigate(path: string) {
  window.location.hash = path;
  window.scrollTo({ top: 0 });
}

function Router() {
  const parts = useRoute();
  const { session } = useStore();

  if (parts.length === 0) return <Landing />;
  if (parts[0] === "masuk") return <Login />;

  if (!session) {
    return <Login notice="Silakan masuk dulu untuk membuka demo." />;
  }

  if (parts[0] === "guru") {
    return <TeacherApp section={parts[1]} id={parts[2]} />;
  }

  if (parts[0] === "siswa") {
    return <StudentApp section={parts[1]} id={parts[2]} />;
  }

  return <Landing />;
}

export default function App() {
  return (
    <StoreProvider>
      <Router />
    </StoreProvider>
  );
}
