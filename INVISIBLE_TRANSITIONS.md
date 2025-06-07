# Invisible Transitions 功能实现

## 概述

Invisible transitions 是 Petri 网中的特殊 transition 类型，通常用于建模内部逻辑或控制流，不代表实际的业务活动。在 PNML 文件中，这些 transitions 通常标记为`activity="$invisible$"`。

## 实现的功能

### 1. 自动检测 Invisible Transitions

- **检测逻辑**：`transition.label is None`
- **数据来源**：PM4Py 解析 PNML 时，invisible transitions 的`label`会被设为`None`
- **名称获取**：从`transition.properties['trans_name_tag']`获取显示名称

### 2. 数据流处理

#### 后端处理

1. **数据模型** (`backend/app/models/petri_net.py`)

   - 添加`isInvisible: Optional[bool] = False`字段

2. **PM4Py 服务** (`backend/app/services/pm4py_service.py`)
   - 检测 invisible transitions：`is_invisible = transition.label is None`
   - 正确获取名称：优先级为 `label` → `properties['trans_name_tag']` → `transition_id`
   - 在 NodeData 中设置`isInvisible`标记

#### 前端处理

3. **Layout 服务** (`frontend/src/services/layoutService.js`)

   - 传递`isInvisible`信息到 React 组件

4. **TransitionNode 组件** (`frontend/src/components/TransitionNode.jsx`)
   - 接收`isInvisible`属性
   - 应用特殊 CSS 类`invisibleTransition`

### 3. 视觉效果

#### Normal Transitions

- 白色背景
- 黑色边框
- 黑色文字

#### Invisible Transitions

- **黑色背景** (#333)
- **黑色边框** (#333)
- **白色文字**
- Hover 时：深灰色背景 (#555)

## 测试验证

### 测试用例

```xml
<!-- Normal Transition -->
<transition id="n5">
    <name><text>Attended_lecture</text></name>
</transition>

<!-- Invisible Transitions -->
<transition id="n7">
    <name><text>tau from tree1</text></name>
    <toolspecific tool="ProM" version="6.4" activity="$invisible$"/>
</transition>
```

### 预期结果

- **n5**: 白色背景，显示"Attended_lecture"
- **n7**: 黑色背景，白色文字，显示"tau from tree1"

## 技术细节

### PM4Py 对象属性

```python
# Normal transition
transition.name = "n5"
transition.label = "Attended_lecture"
transition.properties = {'trans_name_tag': 'Attended_lecture'}

# Invisible transition
transition.name = "n7"
transition.label = None  # 关键标识
transition.properties = {'trans_name_tag': 'tau from tree1'}
```

### CSS 样式实现

```css
.invisibleTransition .transitionRect {
  background: #333;
  border-color: #333;
  color: white;
}

.invisibleTransition .transitionId {
  color: white;
}

.invisibleTransition .transitionName {
  color: white;
  background: rgba(51, 51, 51, 0.9);
  border-color: #333;
}
```

## 统计信息

应用程序会自动统计：

- `visible_transitions`: 普通 transitions 数量
- `invisible_transitions`: invisible transitions 数量

这些信息在 Toolbar 组件中显示，帮助用户了解 Petri 网的结构。

## 使用场景

Invisible transitions 常用于：

1. **控制流建模**：表示内部逻辑转换
2. **同步点**：协调多个并行分支
3. **抽象化**：隐藏实现细节，专注于主要业务流程
4. **模型简化**：在不同抽象层次间转换

通过特殊的视觉表示，用户可以清楚地区分业务活动和内部控制逻辑。
