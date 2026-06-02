import { onRequest } from "mates-fullstack";

onRequest((c) => {
  c.resHeaders["x-benchmark"] = "1";
});
