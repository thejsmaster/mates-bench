import { onRequest, setServerTimeout } from "mates-fullstack";

// Give requests up to 60 seconds (slow SQLite under load)
setServerTimeout(60);

onRequest((c) => {
  c.resHeaders["x-benchmark"] = "1";
});
