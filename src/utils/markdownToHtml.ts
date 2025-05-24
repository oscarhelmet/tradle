/**
 * Simple markdown to HTML converter
 * Converts basic markdown syntax to HTML elements
 */

export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // Convert headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-gray-900 mt-4 mb-2">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-4 mb-2">$1</h1>');

  // Convert bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong class="font-semibold text-gray-900">$1</strong>');

  // Convert italic text
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/_(.*?)_/g, '<em class="italic">$1</em>');

  // Convert unordered lists
  html = html.replace(/^\s*[-*+]\s+(.*$)/gim, '<li class="ml-4 mb-1">• $1</li>');
  
  // Wrap consecutive list items in ul tags
  html = html.replace(/(<li[^>]*>.*<\/li>\s*)+/g, '<ul class="list-none space-y-1 mb-3">$&</ul>');

  // Convert line breaks to paragraphs
  html = html.replace(/\n\n/g, '</p><p class="mb-3">');
  html = html.replace(/\n/g, '<br>');

  // Wrap in paragraph tags if not already wrapped
  if (!html.startsWith('<')) {
    html = '<p class="mb-3">' + html + '</p>';
  }

  // Clean up empty paragraphs
  html = html.replace(/<p[^>]*><\/p>/g, '');

  return html;
}
