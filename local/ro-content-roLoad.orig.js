const roLoad = async () => {
  const paths = new Set();
  for (const group of ["characters", "monsters"])
    for (const entry of Object.values(RO.assets[group] || {}))
      if (!entry.lazy)
        for (const def of Object.values(entry.states || {}))
        paths.add(RO.root + def.file);
  // v1.5.3：地圖背景不預先下載，用到時才載入（ro-v153.js）
  for (const group of ["items", "skills"])
    for (const def of Object.values(RO.assets[group] || {}))
      paths.add(def.dataUrl || RO.root + (def.decoratedFile || def.file));
  for (const def of Object.values(RO.assets.effects?.str || {}))
    for (const file of Object.values(def.textureFiles || {}))
      paths.add(RO.root + file);
  for (const def of Object.values(RO.assets.effects?.textures || {}))
    paths.add(RO.root + def.file);
  for (const def of Object.values(RO.assets.effects?.sprites || {}))
    for (const frame of def.frames) paths.add(RO.root + frame.file);
  await Promise.all(
    [...paths].map(
      (src) =>
        new Promise((resolve) => {
          const im = new Image();
          im.onload = () => {
            RO.images[src] = im;
            resolve();
          };
          im.onerror = () => {
            RO.failed.push(src);
            resolve();
          };
          im.src = src;
        }),
    ),
  );
