// Image path resolution — property photos may live on the API server (uploads)
// or be bundled assets served by the frontend. The API origin is shared with
// the API client so uploaded images always point at the deployed backend.

import { API_BASE_URL } from '../services/api';

const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='560' viewBox='0 0 800 560'%3E%3Crect width='800' height='560' fill='%23eae7e0'/%3E%3Cg fill='none' stroke='%23b8b2a5' stroke-width='4'%3E%3Crect x='280' y='190' width='240' height='180' rx='8'/%3E%3Cpath d='M250 380 L400 200 L550 380 Z'/%3E%3C/g%3E%3Ctext x='400' y='430' text-anchor='middle' fill='%23928b7d' font-family='system-ui' font-size='22'%3EHouseHunt%3C/text%3E%3C/svg%3E";

/**
 * Turn a stored photo path into a usable URL.
 * - "data:" / "http(s):"  → returned as-is
 * - "/uploads/..."        → API server (uploaded files)
 * - "public/assets/..."   → frontend-served bundled asset
 * - "assets/..."          → frontend-served bundled asset
 */
export function resolveImagePath(path) {
  if (!path) return null;
  const value = String(path);
  if (value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  if (value.startsWith('/uploads/')) {
    return `${API_ORIGIN}${value}`;
  }
  if (value.startsWith('public/')) {
    return `/${value.replace('public/', '')}`;
  }
  if (value.startsWith('/assets/')) {
    return value;
  }
  if (value.startsWith('assets/')) {
    return `/${value}`;
  }
  // Fall back to the frontend root for relative paths
  return `/${value}`;
}

/** Return all usable image URLs for a property (falls back to placeholder). */
export function getPropertyImages(property) {
  const paths = property?.listingPhotoPaths;
  if (Array.isArray(paths) && paths.length > 0) {
    const resolved = paths.map(resolveImagePath).filter(Boolean);
    return resolved.length > 0 ? resolved : [PLACEHOLDER_IMAGE];
  }
  return [PLACEHOLDER_IMAGE];
}

export function getPropertyCover(property) {
  return getPropertyImages(property)[0];
}

/**
 * Downscale/compress an image before upload so multipart requests stay far
 * below the serverless 4.5 MB body ceiling. Images already under ~350 KB are
 * returned untouched (avoids an unnecessary canvas round-trip). Non-images and
 * SVGs pass through unchanged.
 *
 * @returns {Promise<File>}
 */
export async function prepareUploadFile(file, { maxDimension = 2560, quality = 0.82, smallThreshold = 350 * 1024 } = {}) {
  if (!file || !file.type || !file.type.startsWith('image/')) return file;
  if (file.type === 'image/svg+xml' || file.size <= smallThreshold) return file;

  let bitmap;
  try {
    if (typeof createImageBitmap === 'function') {
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    }
  } catch {
    bitmap = null;
  }

  // Fallback: classic <img> + object URL when createImageBitmap is unavailable
  if (!bitmap) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Could not decode image'));
        el.src = url;
      });
      const { naturalWidth: w, naturalHeight: h } = img;
      if (w <= 0 || h <= 0) return file;
      const scale = Math.min(1, maxDimension / Math.max(w, h));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
      URL.revokeObjectURL(url);
      if (!blob) return file;
      const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
      return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified });
    } catch {
      URL.revokeObjectURL(url);
      return file;
    }
  }

  const { width: w, height: h } = bitmap;
  const scale = Math.min(1, maxDimension / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close && bitmap.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) return file;
  // Keep the original when compression somehow grew the file
  if (blob.size >= file.size) return file;
  const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified });
}