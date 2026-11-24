# Наведись на бревно и выполни /loganim.
# showfake меняет блок только для вызвавшего команду игрока.
log_block_animation:
  type: command
  name: loganim
  description: Проигрывает анимацию бревна вверх и обратно.
  usage: /loganim
  script:
  - define base <player.cursor_on>
  - define log_material <[base].material>
  - showfake air <[base]> players:<player> d:5s
  - showfake <[log_material]> <[base].add[0,1,0]> players:<player> d:5s
  - wait 2t
  - showfake air <[base].add[0,1,0]> players:<player> d:5s
  - showfake <[log_material]> <[base].add[0,2,0]> players:<player> d:5s
  - wait 2t
  - showfake air <[base].add[0,2,0]> players:<player> d:5s
  - showfake <[log_material]> <[base].add[0,1,0]> players:<player> d:5s
  - wait 2t
  - showfake air <[base].add[0,1,0]> players:<player> d:5s
  - showfake <[log_material]> <[base]> players:<player> d:5s
