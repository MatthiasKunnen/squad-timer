export interface Meta {
    /**
     * Used in Google Search snippets and Open Graph description.
     */
    description: string;

    /**
     * Used to allow insights by app's admins.
     */
    fbAppId?: string;

    /**
     * Image displayed on OG URL preview. Must be either an absolute URL or start with `/`. URLs
     * starting with `/` get prefixed by the current origin.
     */
    image: string;

    /**
     * Text displayed between the title and the suffix.
     */
    pageTitleSeparator?: string;

    /**
     * Text displayed after the page title.
     */
    pageTitleSuffix: string;

    /**
     * Displayed on OG preview. Replaced with title if not present.
     */
    richTitle?: string;

    /**
     * Title of the page in the browser. Will be appended by pageTitleSeparator and pageTitleSuffix.
     */
    title: string;

    /**
     * Type of the object, Open Graph. See <https://ogp.me/#types>.
     */
    type: string;

    /**
     * Used for Open Graph.
     * Unique identifier.
     */
    url?: string;
}
