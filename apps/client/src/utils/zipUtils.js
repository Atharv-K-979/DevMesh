import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export async function exportProjectToZip(files, projectName = 'devmesh-project') {
  const zip = new JSZip();

  for (const [filePath, content] of Object.entries(files)) {
    if (filePath && typeof content === 'string') {
      zip.file(filePath, content);
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}

export async function downloadProjectZip(files, projectName = 'devmesh-workspace') {
  const blob = await exportProjectToZip(files, projectName);
  saveAs(blob, `${projectName}.zip`);
}

export async function importProjectFromZip(zipFile) {
  const zip = await JSZip.loadAsync(zipFile);
  const result = {};

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
