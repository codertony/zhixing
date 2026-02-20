# /zhixing:db

数据库操作命令

## 描述

执行数据库迁移、生成、重置、种子数据等操作

## 用法

```
/zhixing:db migrate    # 运行迁移
/zhixing:db generate   # 生成迁移
/zhixing:db reset      # 重置数据库
/zhixing:db seed       # 加载种子数据
```

## 示例

```
# Schema 变更后生成并应用迁移
/zhixing:db generate
/zhixing:db migrate
```
