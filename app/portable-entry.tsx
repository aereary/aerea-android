import { installPortableFileApi } from "./portable-file-api";

installPortableFileApi();
document.documentElement.dataset.portable = "true";
// Use the same screens, transitions and styles as the Android build.
void import("./native-entry");
