import os
import re
import shutil
from glob import glob


_LEXICON_CACHE = None


def _normalize_dash(text):
    return (text or '').replace('—', '-').replace('–', '-').replace('‑', '-')


def _resolve_tesseract_cmd(pytesseract_module):
    tesseract_cmd = os.environ.get('TESSERACT_CMD')
    if tesseract_cmd:
        pytesseract_module.pytesseract.tesseract_cmd = tesseract_cmd
        return

    if os.name == 'nt':
        default_windows_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        if os.path.exists(default_windows_path):
            pytesseract_module.pytesseract.tesseract_cmd = default_windows_path


def _resolve_poppler_path():
    if os.name != 'nt':
        return None

    poppler_path = os.environ.get('POPPLER_PATH')
    if poppler_path:
        return poppler_path

    if shutil.which('pdftoppm'):
        return None

    poppler_candidates = (
        glob(r'C:\Program Files\poppler*\Library\bin')
        + glob(r'C:\Program Files\poppler*\bin')
        + glob(r'C:\poppler*\Library\bin')
        + glob(r'C:\poppler*\bin')
    )
    for candidate in poppler_candidates:
        if os.path.exists(os.path.join(candidate, 'pdftoppm.exe')):
            return candidate

    return None


def _get_ocr_lexicon():
    global _LEXICON_CACHE
    if _LEXICON_CACHE is not None:
        return _LEXICON_CACHE

    raw = os.environ.get('OCR_LEXICON', '')
    if not raw.strip():
        _LEXICON_CACHE = []
        return _LEXICON_CACHE

    _LEXICON_CACHE = [item.strip() for item in raw.split(',') if item.strip()]
    return _LEXICON_CACHE


def _apply_lexicon_correction(token, rapidfuzz_process):
    lexicon = _get_ocr_lexicon()
    if not lexicon or len(token) < 6 or not token.isalpha() or token != token.upper():
        return token

    match = rapidfuzz_process.extractOne(token, lexicon, score_cutoff=88)
    if not match:
        return token
    return match[0]


def _extract_words_only(img_variant, psm, lang, pytesseract_module, rapidfuzz_process):
    data = pytesseract_module.image_to_data(
        img_variant,
        lang=lang,
        config=f'--oem 3 --psm {psm} preserve_interword_spaces=1',
        output_type=pytesseract_module.Output.DICT,
    )

    line_map = {}
    n = len(data.get('text', []))
    for i in range(n):
        raw_text = _normalize_dash((data['text'][i] or '').strip())
        if not raw_text:
            continue

        try:
            conf = float(data['conf'][i])
        except Exception:
            conf = -1

        if conf < 55:
            continue

        clean = re.sub(r"[^A-Za-z0-9.,:;!?()'\-\"/&%]", '', raw_text).strip()
        if len(clean) < 2:
            continue
        if not re.search(r'[A-Za-z0-9]', clean):
            continue

        if rapidfuzz_process is not None:
            clean = _apply_lexicon_correction(clean, rapidfuzz_process)

        line_key = (
            data.get('block_num', [0] * n)[i],
            data.get('par_num', [0] * n)[i],
            data.get('line_num', [0] * n)[i],
        )
        line_map.setdefault(line_key, []).append(clean)

    lines = [' '.join(words) for _, words in sorted(line_map.items(), key=lambda item: item[0])]
    return '\n'.join(line for line in lines if line.strip())


def _score_text(text_value):
    text_value = (text_value or '').strip()
    if not text_value:
        return -1
    alpha_words = len(re.findall(r'[A-Za-z]{3,}', text_value))
    non_empty_lines = len([line for line in text_value.splitlines() if line.strip()])
    return (alpha_words * 3) + non_empty_lines + (len(text_value) / 80.0)


def _deskew_and_denoise(gray_array, np_module, cv2_module, determine_skew_fn, rotate_fn, img_as_ubyte_fn, denoise_fn):
    if determine_skew_fn is None or rotate_fn is None or img_as_ubyte_fn is None or denoise_fn is None:
        return gray_array

    float_img = gray_array.astype(np_module.float32) / 255.0
    denoised = denoise_fn(float_img, weight=0.08)
    denoised_u8 = img_as_ubyte_fn(denoised)

    try:
        angle = float(determine_skew_fn(denoised_u8))
    except Exception:
        return denoised_u8

    if abs(angle) < 0.2 or abs(angle) > 45:
        return denoised_u8

    rotated = rotate_fn(denoised_u8, angle, resize=True, mode='edge', preserve_range=True)
    rotated_u8 = rotated.astype(np_module.uint8)
    return rotated_u8


def _remove_lines_and_noise(gray_array, cv2_module):
    # Remove long table-like lines and suppress light stamp/noise artifacts.
    h, w = gray_array.shape[:2]
    min_h_kernel = max(20, w // 40)
    min_v_kernel = max(20, h // 40)

    _, inv = cv2_module.threshold(gray_array, 0, 255, cv2_module.THRESH_BINARY_INV + cv2_module.THRESH_OTSU)

    horizontal_kernel = cv2_module.getStructuringElement(cv2_module.MORPH_RECT, (min_h_kernel, 1))
    vertical_kernel = cv2_module.getStructuringElement(cv2_module.MORPH_RECT, (1, min_v_kernel))

    horizontal_lines = cv2_module.morphologyEx(inv, cv2_module.MORPH_OPEN, horizontal_kernel, iterations=1)
    vertical_lines = cv2_module.morphologyEx(inv, cv2_module.MORPH_OPEN, vertical_kernel, iterations=1)
    line_mask = cv2_module.bitwise_or(horizontal_lines, vertical_lines)

    no_lines = cv2_module.inpaint(gray_array, line_mask, 3, cv2_module.INPAINT_TELEA)

    # Opening clears small dark specks; closing reconnects thin broken characters.
    open_kernel = cv2_module.getStructuringElement(cv2_module.MORPH_RECT, (2, 2))
    close_kernel = cv2_module.getStructuringElement(cv2_module.MORPH_RECT, (2, 2))
    opened = cv2_module.morphologyEx(no_lines, cv2_module.MORPH_OPEN, open_kernel, iterations=1)
    cleaned = cv2_module.morphologyEx(opened, cv2_module.MORPH_CLOSE, close_kernel, iterations=1)
    return cleaned


def _extract_from_image(
    image_obj,
    lang,
    mode,
    pil_image_module,
    pytesseract_module,
    np_module,
    cv2_module,
    rapidfuzz_process,
    determine_skew_fn,
    rotate_fn,
    img_as_ubyte_fn,
    denoise_fn,
):
    from PIL import ImageOps

    base = image_obj.convert('L')
    base = base.resize((base.width * 2, base.height * 2), pil_image_module.Resampling.LANCZOS)
    base = ImageOps.autocontrast(base)
    bw = base.point(lambda px: 255 if px > 170 else 0, mode='1')

    variants = [base, bw]
    psm_modes = ['6']

    if mode == 'high_precision':
        psm_modes = ['4', '6', '7', '11']
        if cv2_module is not None:
            arr = np_module.array(base)
            arr = _deskew_and_denoise(
                arr,
                np_module,
                cv2_module,
                determine_skew_fn,
                rotate_fn,
                img_as_ubyte_fn,
                denoise_fn,
            )
            adaptive = cv2_module.adaptiveThreshold(
                arr,
                255,
                cv2_module.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2_module.THRESH_BINARY,
                31,
                15,
            )
            variants.append(pil_image_module.fromarray(adaptive))

            cleaned = _remove_lines_and_noise(arr, cv2_module)
            cleaned_adaptive = cv2_module.adaptiveThreshold(
                cleaned,
                255,
                cv2_module.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2_module.THRESH_BINARY,
                31,
                12,
            )
            variants.append(pil_image_module.fromarray(cleaned))
            variants.append(pil_image_module.fromarray(cleaned_adaptive))

    best_text = ''
    best_score = -1
    for img_variant in variants:
        for psm in psm_modes:
            candidate = _extract_words_only(
                img_variant,
                psm=psm,
                lang=lang,
                pytesseract_module=pytesseract_module,
                rapidfuzz_process=rapidfuzz_process,
            )
            candidate_score = _score_text(candidate)
            if candidate_score > best_score:
                best_score = candidate_score
                best_text = (candidate or '').strip()

    return best_text


def extract_text_tesseract(uploaded_file, lang='eng', mode='fast'):
    try:
        from PIL import Image
        import pytesseract
        from pdf2image import convert_from_bytes
        from pdf2image.exceptions import PDFInfoNotInstalledError, PDFPageCountError, PDFSyntaxError
        import numpy as np
        from rapidfuzz import process as rapidfuzz_process
        try:
            import cv2
        except Exception:
            cv2 = None
        try:
            from deskew import determine_skew
            from skimage.transform import rotate
            from skimage.util import img_as_ubyte
            from skimage.restoration import denoise_tv_chambolle
        except Exception:
            determine_skew = None
            rotate = None
            img_as_ubyte = None
            denoise_tv_chambolle = None
    except ModuleNotFoundError as exc:
        raise RuntimeError(f'Missing OCR dependency: {str(exc)}. Install OCR packages in the active backend environment.')

    _resolve_tesseract_cmd(pytesseract)

    file_name = (uploaded_file.name or '').lower()

    try:
        if file_name.endswith('.pdf'):
            poppler_path = _resolve_poppler_path()
            pdf_bytes = uploaded_file.read()
            pages = convert_from_bytes(pdf_bytes, dpi=300, poppler_path=poppler_path)
            extracted_pages = []
            for page in pages:
                page_text = _extract_from_image(
                    page,
                    lang,
                    mode,
                    Image,
                    pytesseract,
                    np,
                    cv2,
                    rapidfuzz_process,
                    determine_skew,
                    rotate,
                    img_as_ubyte,
                    denoise_tv_chambolle,
                )
                if page_text and page_text.strip():
                    extracted_pages.append(page_text.strip())
            return {'text': '\n\n'.join(extracted_pages), 'pages': len(pages)}

        image = Image.open(uploaded_file)
        extracted_text = _extract_from_image(
            image,
            lang,
            mode,
            Image,
            pytesseract,
            np,
            cv2,
            rapidfuzz_process,
            determine_skew,
            rotate,
            img_as_ubyte,
            denoise_tv_chambolle,
        )
        return {'text': (extracted_text or '').strip(), 'pages': 1}
    except pytesseract.TesseractNotFoundError:
        raise RuntimeError('Tesseract executable not found. Set TESSERACT_CMD or add Tesseract to PATH.')
    except PDFInfoNotInstalledError:
        raise RuntimeError(
            'Poppler is required for PDF OCR. Install Poppler and set POPPLER_PATH to the folder containing '
            'pdftoppm.exe (e.g., C:\\path\\to\\poppler\\Library\\bin).'
        )
    except (PDFPageCountError, PDFSyntaxError) as exc:
        raise RuntimeError(f'Invalid or unreadable PDF: {str(exc)}')
    except Exception as exc:
        raise RuntimeError(f'OCR extraction failed: {str(exc)}')


def extract_text(uploaded_file, engine='tesseract', mode='fast', lang='eng'):
    selected_engine = (engine or 'tesseract').strip().lower()
    selected_mode = (mode or 'fast').strip().lower()

    if selected_engine != 'tesseract':
        raise RuntimeError(f'Unsupported OCR engine: {selected_engine}')

    if selected_mode not in {'fast', 'high_precision'}:
        selected_mode = 'fast'

    return extract_text_tesseract(uploaded_file, lang=lang, mode=selected_mode)
