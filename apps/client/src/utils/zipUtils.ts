import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Packs a map of { [filePath: string]: fileContent } into a JSZip archive and returns the Blob.
 */
export async function exportProjectToZip(
  files: Record<string, string>,
  projectName: string = 'devmesh-project',
): Promise<Blob> {
  const zip = new JSZip();

  for (const [filePath, content] of Object.entries(files)) {
    if (filePath && typeof content === 'string') {
      zip.file(filePath, content);
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Exports and triggers browser file download for the workspace ZIP.
 */
export async function downloadProjectZip(
  files: Record<string, string>,
  projectName: string = 'devmesh-workspace',
): Promise<void> {
  const blob = await exportProjectToZip(files, projectName);
  saveAs(blob, `${projectName}.zip`);
}

/**
 * Parses an uploaded ZIP File/Blob and extracts all non-directory text entries.
 */
export async function importProjectFromZip(
  zipFile: File | Blob,
): Promise<Record<string, string>> {
  const zip = await JSZip.loadAsync(zipFile);
  const result: Record<string, string> = {};

  const entries = Object.entries(zip.files);
  for (const [relativePath, zipEntry] of entries) {
    // Ignore directories and OS metadata like __MACOSX / .DS_Store
    if (!zipEntry.dir && !relativePath.includes('__MACOSX') && !relativePath.endsWith('.DS_Store')) {
      const content = await zipEntry.async('string');
      result[relativePath] = content;
    }
  }

  return result;
}
