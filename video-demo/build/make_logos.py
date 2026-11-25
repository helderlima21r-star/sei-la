# Converte os logos enviados em versões com fundo transparente para fundo escuro.
import sys
import numpy as np
from PIL import Image
src_lsg, src_latam, out = sys.argv[1], sys.argv[2], sys.argv[3]

def crop(a):
    ys, xs = np.where(a[..., 3] > 8)
    return a[ys.min() - 4:ys.max() + 5, xs.min() - 4:xs.max() + 5]

# LSG Sky Chefs: branco sobre preto -> branco com transparência
a = np.asarray(Image.open(src_lsg).convert('RGB')).astype(float)
lum = a.max(axis=2)
rgba = np.zeros(a.shape[:2] + (4,), np.uint8)
rgba[..., :3] = 255
rgba[..., 3] = np.clip(lum, 0, 255).astype(np.uint8)
Image.fromarray(crop(rgba)).save(f'{out}/lsg-skychefs.png')

# LATAM: azul sobre branco -> versão negativa (letras brancas, detalhe vermelho mantido)
a = np.asarray(Image.open(src_latam).convert('RGB')).astype(float)
alpha = np.clip((255 - a.min(axis=2)) * 1.15, 0, 255)
red = (a[..., 0] - a[..., 2]) > 40
rgba = np.zeros(a.shape[:2] + (4,), np.uint8)
rgba[..., 0] = np.where(red, 237, 255)
rgba[..., 1] = np.where(red, 22, 255)
rgba[..., 2] = np.where(red, 80, 255)
rgba[..., 3] = alpha.astype(np.uint8)
Image.fromarray(crop(rgba)).save(f'{out}/latam-negativo.png')
print('ok')
