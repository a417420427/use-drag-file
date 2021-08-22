# 监听拖拽上传的文件内容

## 使用
```js
import {useDragFile} from '@a417420427/use-drag-file'

// const {dropFiles} = useDragFile()
// or
const onDragover = () => {}
const onDrop =() => {}
const onDragenter = () => {}
// dropFiles 文件和当前文件路径信息
const {dropFiles} = useDragFile({
  onDragover,
  onDrop,
  onDragenter
})
```

## [demo](https://blog.zxueping.com/dist/index.html#/Sample)