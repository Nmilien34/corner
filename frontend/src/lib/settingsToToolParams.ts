import type { ToolName } from '../types';
import type { RightPanelSettings } from '../components/Layout/RightPanel';

/**
 * Maps RightPanelSettings to the params object expected by each tool's execute API.
 * Backend tools may not yet support all keys; they ignore unknown params.
 */
export function settingsToToolParams(
  tool: ToolName,
  settings: RightPanelSettings
): Record<string, unknown> {
  const opts = settings as Record<string, unknown>;
  switch (tool) {
    case 'compress_pdf':
      return {
        quality: opts.pdfQuality ?? 'ebook',
        removeMetadata: opts.removeMetadata ?? false,
        removeEmbeddedFonts: opts.removeEmbeddedFonts ?? false,
      };
    case 'pdf_to_word':
      return {
        pageRange: opts.pageRange || undefined,
        preserveFormatting: opts.preserveFormatting ?? false,
        extractImages: opts.extractImages ?? false,
      };
    case 'merge_pdf':
      return { pageRange: opts.pageRange || undefined };
    case 'split_pdf':
      return {
        splitMode: opts.splitMode ?? 'every',
        pageRange: opts.pageRange || undefined,
        outputNamingPattern: opts.outputNamingPattern || undefined,
      };
    case 'word_to_pdf':
      return {
        pageSize: opts.pageSize ?? 'a4',
        orientation: opts.orientation ?? 'portrait',
        embedFonts: opts.embedFonts ?? false,
      };
    case 'compress_image':
      return {
        quality: opts.imageQuality ?? 75,
        stripMetadata: opts.stripMetadata ?? false,
        progressiveJpeg: opts.progressiveJpeg ?? false,
      };
    case 'convert_image':
      return {
        format: opts.outputFormat ?? 'png',
        quality: opts.imageQuality ?? 80,
        preserveTransparency: opts.preserveTransparency ?? false,
      };
    case 'remove_background':
      return {
        bgReplacementColor: opts.bgReplacementColor || undefined,
      };
    case 'resize_image':
      return {
        width: opts.resizeWidth,
        height: opts.resizeHeight,
        maintainAspectRatio: opts.maintainAspectRatio ?? true,
        resizeUnit: opts.resizeUnit ?? 'px',
        resizeMode: opts.resizeMode ?? 'fit',
        allowUpscale: opts.allowUpscale ?? false,
      };
    case 'ocr':
      return {
        languages: opts.ocrLanguages ?? ['eng'],
        outputFormat: opts.ocrOutputFormat ?? 'text',
        preserveLayout: opts.preserveLayout ?? false,
      };
    case 'esign':
      return {
        placementMode: opts.placementMode ?? 'auto',
        dateFormat: opts.dateFormat ?? 'MM/DD/YYYY',
        addDateStamp: opts.addDateStamp ?? false,
        addTypedName: opts.addTypedName ?? false,
        signatureScale: opts.signatureScale ?? 100,
      };
    case 'generate_qr':
      return {
        qrContentType: opts.qrContentType ?? 'url',
        qrSize: opts.qrSize ?? 256,
        qrErrorCorrection: opts.qrErrorCorrection ?? 'M',
        qrForeground: opts.qrForeground ?? '#1A1714',
        qrBackground: opts.qrBackground ?? '#FFFFFF',
        qrOutputFormat: opts.qrOutputFormat ?? 'png',
        qrRoundedCorners: opts.qrRoundedCorners ?? false,
      };
    case 'rotate_pdf':
      return {
        direction: opts.rotateDirection ?? 'clockwise',
        applyTo: opts.rotateApplyTo ?? 'all',
        pageRange: opts.pageRange || undefined,
      };
    case 'add_page_numbers':
      return {
        position: opts.pageNumberPosition ?? 'bottom-center',
        startNumber: opts.pageNumberStart ?? 1,
        fontSize: opts.pageNumberFontSize ?? 12,
      };
    case 'add_watermark_pdf':
      return {
        text: opts.watermarkText ?? 'CONFIDENTIAL',
        position: opts.watermarkPosition ?? 'center',
        opacity: opts.watermarkOpacity ?? 30,
        rotation: opts.watermarkRotation ?? -45,
        fontSize: opts.watermarkFontSize ?? 48,
        color: opts.watermarkColor ?? '#000000',
        tile: opts.watermarkTile ?? false,
      };
    case 'password_protect_pdf':
      return {
        openPassword: opts.openPassword || undefined,
        permissionsPassword: opts.permissionsPassword || undefined,
        restrictPrinting: opts.restrictPrinting ?? false,
        restrictEditing: opts.restrictEditing ?? false,
        restrictCopying: opts.restrictCopying ?? false,
      };
    case 'remove_pdf_password':
      return { currentPassword: opts.currentPassword || '' };
    case 'flip_rotate_image':
      return { action: opts.flipRotateAction ?? 'rotate_90' };
    case 'add_border_image':
      return {
        borderWidth: opts.borderWidth ?? 10,
        borderColor: opts.borderColor ?? '#000000',
      };
    case 'watermark_image':
      return {
        text: opts.watermarkText ?? 'CONFIDENTIAL',
        opacity: opts.watermarkOpacity ?? 50,
        position: opts.watermarkPosition ?? 'center',
        rotation: opts.watermarkRotation ?? -45,
        fontSize: opts.watermarkFontSize ?? 48,
        color: opts.watermarkColor ?? '#000000',
      };
    case 'image_to_pdf':
      return {
        pageSize: opts.imageToPdfPageSize ?? 'a4',
        orientation: opts.imageToPdfOrientation ?? 'portrait',
        fitMode: opts.imageToPdfFitMode ?? 'fit',
      };
    default:
      return {};
  }
}
