/**
 * Directory data for every post in src/posts.
 *
 * `permalink` is computed rather than static so posts get flat URLs
 * (/my-post/ instead of /posts/my-post/). It has to be a function because
 * plain JSON data files are not template-processed in Eleventy.
 */
module.exports = {
  layout: "layouts/post.njk",
  tags: ["post"],
  ogType: "article",
  eleventyComputed: {
    permalink: (data) => `/${data.page.fileSlug}/`,
  },
};
