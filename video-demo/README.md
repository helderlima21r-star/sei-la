# Vídeo demo — Conferência (LSG Sky Chefs · LATAM)

`conferencia-demo.mp4` — vídeo de apresentação do app, 1920×1080, 30 fps, 79 s, com trilha original (`build/make_music.py`).

Tudo que aparece no vídeo é o app real (cópia em `app-snapshot/`) rodando com um
Firebase falso e **dados de exemplo** — voos, nomes e fotos são fictícios.

## Como gerar de novo

```bash
cd build
python3 make_photos.py photos   # fotos ilustrativas de exemplo
node capture.js                 # abre o app com dados de exemplo e captura as telas em shots/
node render.js preview 5,20,40  # (opcional) quadros soltos em preview/
node render.js video ../conferencia-demo.mp4 30
```

- `video.html` — a animação inteira (roteiro, tempos, textos, callouts). Para mudar
  textos ou o nome no final, edite `COPIES`, `CALLS`, `FEATS` ou o bloco `#outro`.
- Os nomes "LSG SKY CHEFS" e "LATAM" no final estão só em texto. Para usar os logos
  oficiais, coloque os arquivos aqui e troque os `.wm` em `video.html` por `<img>`.
