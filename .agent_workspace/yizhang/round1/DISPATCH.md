# Round 1 派发 · 异掌

父调度器：本机编排。10 个 Task 全部 `environment=cloud`，模型按表，禁止降级。  
云端并发若排队，仍保持 10 路派发，不改成别的模型。

基座：`cursor/yizhang-db8d`  
只写自己的路径。提交信息用中文或英文均可，但代码注释用中文简要即可。  
首行输出：`MODEL_SLUG: <实际 slug>`

不要创建指向 `main` 的“完工”假象；做完在自己的云端分支 push。父调度器负责合回 `cursor/yizhang-db8d`。
