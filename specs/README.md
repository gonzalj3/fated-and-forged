# Image-loading model

`ImageLoading.tla` models the storefront's loading policy rather than network speed. It verifies that the hero image is requested at first paint, loaded images never regress, offscreen images are eventually requested, and every displayed image belongs to one of the two supported collections.

The executable tests in `tests/storefront-performance.test.mjs` enforce the implementation details that TLA+ cannot measure: WebP presence, byte budgets, preload markup, browser loading priority, static catalog reads, and removal of the bracelet collection.

Run the model with the official TLA+ tools JAR:

```bash
java -jar /path/to/tla2tools.jar -config specs/ImageLoading.cfg specs/ImageLoading.tla
```
