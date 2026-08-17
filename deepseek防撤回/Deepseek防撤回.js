// ==UserScript==
// @name         DeepSeek 防撤回 (前端版)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  只在本地显示撤回内容，不修改发送给AI的上下文，纯前端。
// @author       Maid
// @match        https://chat.deepseek.com/*
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // ============================================================
    //  常量
    // ============================================================
    var TEMPLATE_RESPONSE = "TEMPLATE_RESPONSE";
    var CONTENT_FILTER = "CONTENT_FILTER";
    var RECALL_TIP = " 此回复已被撤回，以下为本地缓存内容";
    var RECALL_NOT_FOUND = " 此回复已被撤回，本地缓存中未找到";

    // ============================================================
    //  工具函数
    // ============================================================
    function extractResponseContent(fragments) {
        if (!fragments || !Array.isArray(fragments)) return '';
        var content = '';
        for (var i = 0; i < fragments.length; i++) {
            if (fragments[i].type === 'RESPONSE' && fragments[i].content) {
                content += fragments[i].content;
            }
        }
        return content;
    }

    function _getKey(sid, mid) {
        return "ds_recall_" + (sid || "") + "_" + (mid || "");
    }

    function saveRecalledMessage(sid, mid, frags) {
        try {
            localStorage.setItem(_getKey(sid, mid), JSON.stringify(frags));
        } catch(e) {}
    }

    function getRecalledMessage(sid, mid) {
        try {
            var raw = localStorage.getItem(_getKey(sid, mid));
            if (raw) {
                var frags = JSON.parse(raw);
                frags.push({
                    "id": frags.length + 1,
                    "type": "TIP",
                    "style": "WARNING",
                    "content": RECALL_TIP
                });
                return frags;
            }
        } catch(e) {}
        return [{"content": RECALL_NOT_FOUND, "id": 2, "type": TEMPLATE_RESPONSE}];
    }

    // ============================================================
    //  SSE 状态机 (仅负责防撤回检测与替换)
    // ============================================================
    function DSState() {
        this.fields = {};
        this.sessId = "";
        this.recalled = false;
        this._updatePath = "";
        this._updateMode = "SET";
    }

    // 更新字段（与原脚本一致）
    DSState.prototype.setField = function(path, value, mode) {
        var keys = path.split("/"), current = this.fields;
        for (var i = 0; i < keys.length - 1; i++) {
            var key = keys[i];
            if (!(key in current)) {
                current[key] = typeof keys[i+1] === "number" ? [] : {};
            }
            current = current[key];
        }
        var lastKey = keys[keys.length - 1];
        if (mode === "APPEND") {
            if (Array.isArray(current[lastKey])) {
                current[lastKey] = current[lastKey].concat(value);
            } else {
                current[lastKey] = (current[lastKey] || "") + value;
            }
        } else {
            current[lastKey] = value;
        }
    };

    // 处理 batch 更新
    DSState.prototype.update = function(data) {
        if (data.p) this._updatePath = data.p;
        if (data.o) this._updateMode = data.o;
        var value = data.v;
        if (typeof value === "object" && this._updatePath === "") {
            for (var key in value) {
                if (value.hasOwnProperty(key)) this.fields[key] = value[key];
            }
            return "";
        }
        this.setField(this._updatePath, value, this._updateMode);
        return "";
    };

    // 检测撤回并替换（核心）
    DSState.prototype.checkAndReplace = function(data) {
        var mode = data.o || this._updateMode;
        var path = data.p || this._updatePath;
        if (mode === "BATCH" && path === "response") {
            for (var i = 0; i < data.v.length; i++) {
                var v = data.v[i];
                if (v.p === "fragments" && v.v && v.v.length > 0 && v.v[0].type === TEMPLATE_RESPONSE) {
                    // 保存真实内容
                    try {
                        saveRecalledMessage(
                            this.sessId,
                            this.fields.response.message_id,
                            this.fields.response.fragments
                        );
                    } catch(e) {}
                    this.recalled = true;
                    // 替换为提示
                    data.v[i] = {
                        "v": [{"id": 1, "type": "TIP", "style": "WARNING", "content": RECALL_TIP}],
                        "p": "fragments",
                        "o": "APPEND"
                    };
                }
                if (v.p === "status" && v.v === CONTENT_FILTER) {
                    this.recalled = true;
                    data.v[i] = {"p": "status", "v": "FINISHED"};
                }
            }
            if (this.recalled) return JSON.stringify(data);
        }
        return "";
    };

    // ============================================================
    //  SSE 流处理
    // ============================================================
    function processSSEStream(rawText, lastLen, dsState) {
        if (!rawText || rawText.length <= lastLen) {
            return { text: rawText, newLen: lastLen, modified: false };
        }
        var newPart = rawText.substring(lastLen);
        var lines = newPart.split("\n");
        var modified = false;

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (!line || line.indexOf("data:") !== 0) continue;
            try {
                var jsonStr = line.replace(/^data:\s*/, "");
                var data = JSON.parse(jsonStr);
                if (data.v) {
                    dsState.update(data);
                    var replacement = dsState.checkAndReplace(data);
                    if (replacement) {
                        lines[i] = "data: " + replacement;
                        modified = true;
                    }
                }
            } catch(e) {}
        }

        if (modified) {
            var newText = rawText.substring(0, lastLen) + lines.join("\n");
            return { text: newText, newLen: newText.length, modified: true };
        }
        return { text: rawText, newLen: rawText.length, modified: false };
    }

    // ============================================================
    //  历史记录处理
    // ============================================================
    function processHistoryJSON(rawText) {
        try {
            var json = JSON.parse(rawText);
            if (!json.data || !json.data.biz_data) return rawText;
            var data = json.data.biz_data;
            var sessId = data.chat_session ? data.chat_session.id : "";
            var modified = false;

            for (var i = 0; i < data.chat_messages.length; i++) {
                var msg = data.chat_messages[i];
                if (msg.status === CONTENT_FILTER) {
                    msg.fragments = getRecalledMessage(sessId, msg.message_id);
                    msg.status = "FINISHED";
                    modified = true;
                }
            }

            if (modified) {
                json.data.biz_data = data;
                return JSON.stringify(json);
            }
        } catch(e) {}
        return rawText;
    }

    // ============================================================
    //  拦截器
    // ============================================================
    function isGenerateUrl(url) {
        return url.indexOf("/api/v0/chat/completion") !== -1 ||
               url.indexOf("/api/v0/chat/edit_message") !== -1 ||
               url.indexOf("/api/v0/chat/regenerate") !== -1 ||
               url.indexOf("/api/v0/chat/continue") !== -1 ||
               url.indexOf("/api/v0/chat/resume_stream") !== -1;
    }

    function isHistoryUrl(url) {
        return url.indexOf("/api/v0/chat/history_messages") !== -1;
    }

    var _origSend = XMLHttpRequest.prototype.send;
    var _origOpen = XMLHttpRequest.prototype.open;
    var _origSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

    var _respTextDesc = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, "responseText");
    var _respDesc = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, "response");
    var _origRespTextGetter = _respTextDesc ? _respTextDesc.get : null;
    var _origRespGetter = _respDesc ? _respDesc.get : null;

    XMLHttpRequest.prototype.open = function(method, url) {
        this._ds_url = (url || "").split("?")[0];
        this._ds_method = method;
        return _origOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
        if (header === "x-client-locale") this._ds_locale = value;
        if (!this._ds_headers) this._ds_headers = {};
        this._ds_headers[header] = value;
        return _origSetRequestHeader.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(body) {
        var xhr = this;
        var url = xhr._ds_url || "";

        if (!isGenerateUrl(url) && !isHistoryUrl(url)) {
            return _origSend.apply(this, arguments);
        }

        var _isGen = isGenerateUrl(url);
        var _isHist = isHistoryUrl(url);
        var _dsState = null;
        var _lastLen = 0;
        var _cached = "";
        var _hasOv = false;

        // 捕获会话ID
        if (_isGen && body) {
            try {
                var bj = JSON.parse(body);
                xhr._ds_sessId = bj.chat_session_id || "";
            } catch(e) {}
        }

        if (_isGen) {
            _dsState = new DSState();
            _dsState.sessId = xhr._ds_sessId || "";
        }

        // 重写 responseText 和 response 拦截器
        if (_origRespTextGetter) {
            try {
                Object.defineProperty(xhr, "responseText", {
                    get: function() {
                        var raw = _origRespTextGetter.call(xhr);
                        if (!raw) return raw;
                        if (_isGen && _dsState) {
                            var result = processSSEStream(raw, _lastLen, _dsState);
                            _lastLen = result.newLen;
                            if (result.modified) {
                                _cached = result.text;
                                return _cached;
                            }
                            _cached = raw;
                            return raw;
                        }
                        if (_isHist) {
                            return processHistoryJSON(raw);
                        }
                        return raw;
                    },
                    configurable: true,
                    enumerable: true
                });
                _hasOv = true;
            } catch(e) {}
        }

        if (_origRespGetter && _hasOv) {
            try {
                Object.defineProperty(xhr, "response", {
                    get: function() {
                        var raw = _origRespGetter.call(xhr);
                        if (!raw) return raw;
                        if (_isHist) return processHistoryJSON(raw);
                        return raw;
                    },
                    configurable: true,
                    enumerable: true
                });
            } catch(e) {}
        }

        // 重要：不对 body 做任何修改，原样发送
        return _origSend.call(this, body);
    };

})();