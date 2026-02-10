declare module "*.svg?component" {
  import type { SvelteComponent } from "svelte";
  const component: typeof SvelteComponent;
  export default component;
}

declare module "*.svg?url" {
  const url: string;
  export default url;
}

declare module "*.svg" {
  const content: string;
  export default content;
}
