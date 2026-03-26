(!(function () {
  try {
    var e =
        'undefined' != typeof window
          ? window
          : 'undefined' != typeof global
            ? global
            : 'undefined' != typeof globalThis
              ? globalThis
              : 'undefined' != typeof self
                ? self
                : {},
      t = new e.Error().stack;
    t &&
      ((e._sentryDebugIds = e._sentryDebugIds || {}),
      (e._sentryDebugIds[t] = '9ad4350c-a0cd-4f2a-b585-eea95335aeb7'),
      (e._sentryDebugIdIdentifier = 'sentry-dbid-9ad4350c-a0cd-4f2a-b585-eea95335aeb7'));
  } catch (e) {}
})(),
  (() => {
    'use strict';
    let e,
      t,
      a,
      s = {
        googleAnalytics: 'googleAnalytics',
        precache: 'precache-v2',
        prefix: 'serwist',
        runtime: 'runtime',
        suffix: 'undefined' != typeof registration ? registration.scope : '',
      },
      r = (e) => [s.prefix, e, s.suffix].filter((e) => e && e.length > 0).join('-'),
      n = {
        updateDetails: (e) => {
          var t = (t) => {
            let a = e[t];
            'string' == typeof a && (s[t] = a);
          };
          for (let e of Object.keys(s)) t(e);
        },
        getGoogleAnalyticsName: (e) => e || r(s.googleAnalytics),
        getPrecacheName: (e) => e || r(s.precache),
        getRuntimeName: (e) => e || r(s.runtime),
      };
    class i extends Error {
      details;
      constructor(e, t) {
        (super(
          ((e, ...t) => {
            let a = e;
            return (t.length > 0 && (a += ` :: ${JSON.stringify(t)}`), a);
          })(e, t)
        ),
          (this.name = e),
          (this.details = t));
      }
    }
    function c(e) {
      return new Promise((t) => setTimeout(t, e));
    }
    let o = new Set();
    function l(e, t) {
      let a = new URL(e);
      for (let e of t) a.searchParams.delete(e);
      return a.href;
    }
    async function h(e, t, a, s) {
      let r = l(t.url, a);
      if (t.url === r) return e.match(t, s);
      let n = { ...s, ignoreSearch: !0 };
      for (let i of await e.keys(t, n)) if (r === l(i.url, a)) return e.match(i, s);
    }
    class u {
      promise;
      resolve;
      reject;
      constructor() {
        this.promise = new Promise((e, t) => {
          ((this.resolve = e), (this.reject = t));
        });
      }
    }
    let d = async () => {
        for (let e of o) await e();
      },
      m = '-precache-',
      f = async (e, t = m) => {
        let a = (await self.caches.keys()).filter(
          (a) => a.includes(t) && a.includes(self.registration.scope) && a !== e
        );
        return (await Promise.all(a.map((e) => self.caches.delete(e))), a);
      },
      g = (e, t) => {
        let a = t();
        return (e.waitUntil(a), a);
      },
      w = (e, t) => t.some((t) => e instanceof t),
      p = new WeakMap(),
      y = new WeakMap(),
      _ = new WeakMap(),
      b = {
        get(e, t, a) {
          if (e instanceof IDBTransaction) {
            if ('done' === t) return p.get(e);
            if ('store' === t)
              return a.objectStoreNames[1] ? void 0 : a.objectStore(a.objectStoreNames[0]);
          }
          return x(e[t]);
        },
        set: (e, t, a) => ((e[t] = a), !0),
        has: (e, t) => (e instanceof IDBTransaction && ('done' === t || 'store' === t)) || t in e,
      };
    function x(e) {
      if (e instanceof IDBRequest) {
        let t = new Promise((t, a) => {
          let s = () => {
              (e.removeEventListener('success', r), e.removeEventListener('error', n));
            },
            r = () => {
              (t(x(e.result)), s());
            },
            n = () => {
              (a(e.error), s());
            };
          (e.addEventListener('success', r), e.addEventListener('error', n));
        });
        return (_.set(t, e), t);
      }
      if (y.has(e)) return y.get(e);
      let s = (function (e) {
        if ('function' == typeof e)
          return (
            a ||
            (a = [
              IDBCursor.prototype.advance,
              IDBCursor.prototype.continue,
              IDBCursor.prototype.continuePrimaryKey,
            ])
          ).includes(e)
            ? function (...t) {
                return (e.apply(R(this), t), x(this.request));
              }
            : function (...t) {
                return x(e.apply(R(this), t));
              };
        return (e instanceof IDBTransaction &&
          (function (e) {
            if (p.has(e)) return;
            let t = new Promise((t, a) => {
              let s = () => {
                  (e.removeEventListener('complete', r),
                    e.removeEventListener('error', n),
                    e.removeEventListener('abort', n));
                },
                r = () => {
                  (t(), s());
                },
                n = () => {
                  (a(e.error || new DOMException('AbortError', 'AbortError')), s());
                };
              (e.addEventListener('complete', r),
                e.addEventListener('error', n),
                e.addEventListener('abort', n));
            });
            p.set(e, t);
          })(e),
        w(e, t || (t = [IDBDatabase, IDBObjectStore, IDBIndex, IDBCursor, IDBTransaction])))
          ? new Proxy(e, b)
          : e;
      })(e);
      return (s !== e && (y.set(e, s), _.set(s, e)), s);
    }
    let R = (e) => _.get(e);
    function E(e, t, { blocked: a, upgrade: s, blocking: r, terminated: n } = {}) {
      let i = indexedDB.open(e, t),
        c = x(i);
      return (
        s &&
          i.addEventListener('upgradeneeded', (e) => {
            s(x(i.result), e.oldVersion, e.newVersion, x(i.transaction), e);
          }),
        a && i.addEventListener('blocked', (e) => a(e.oldVersion, e.newVersion, e)),
        c
          .then((e) => {
            (n && e.addEventListener('close', () => n()),
              r && e.addEventListener('versionchange', (e) => r(e.oldVersion, e.newVersion, e)));
          })
          .catch(() => {}),
        c
      );
    }
    let v = ['get', 'getKey', 'getAll', 'getAllKeys', 'count'],
      q = ['put', 'add', 'delete', 'clear'],
      S = new Map();
    function D(e, t) {
      if (!(e instanceof IDBDatabase && !(t in e) && 'string' == typeof t)) return;
      if (S.get(t)) return S.get(t);
      let a = t.replace(/FromIndex$/, ''),
        s = t !== a,
        r = q.includes(a);
      if (!(a in (s ? IDBIndex : IDBObjectStore).prototype) || !(r || v.includes(a))) return;
      let n = async function (e, ...t) {
        let n = this.transaction(e, r ? 'readwrite' : 'readonly'),
          i = n.store;
        return (s && (i = i.index(t.shift())), (await Promise.all([i[a](...t), r && n.done]))[0]);
      };
      return (S.set(t, n), n);
    }
    b = ((e) => ({
      ...e,
      get: (t, a, s) => D(t, a) || e.get(t, a, s),
      has: (t, a) => !!D(t, a) || e.has(t, a),
    }))(b);
    let N = ['continue', 'continuePrimaryKey', 'advance'],
      C = {},
      P = new WeakMap(),
      T = new WeakMap(),
      A = {
        get(e, t) {
          if (!N.includes(t)) return e[t];
          let a = C[t];
          return (
            a ||
              (a = C[t] =
                function (...e) {
                  P.set(this, T.get(this)[t](...e));
                }),
            a
          );
        },
      };
    async function* k(...e) {
      let t = this;
      if ((t instanceof IDBCursor || (t = await t.openCursor(...e)), !t)) return;
      let a = new Proxy(t, A);
      for (T.set(a, t), _.set(a, R(t)); t; )
        (yield a, (t = await (P.get(a) || t.continue())), P.delete(a));
    }
    function I(e, t) {
      return (
        (t === Symbol.asyncIterator && w(e, [IDBIndex, IDBObjectStore, IDBCursor])) ||
        ('iterate' === t && w(e, [IDBIndex, IDBObjectStore]))
      );
    }
    b = ((e) => ({
      ...e,
      get: (t, a, s) => (I(t, a) ? k : e.get(t, a, s)),
      has: (t, a) => I(t, a) || e.has(t, a),
    }))(b);
    let U = async (t, a) => {
        let s = null;
        if ((t.url && (s = new URL(t.url).origin), s !== self.location.origin))
          throw new i('cross-origin-copy-response', { origin: s });
        let r = t.clone(),
          n = { headers: new Headers(r.headers), status: r.status, statusText: r.statusText },
          c = a ? a(n) : n,
          o = !(function () {
            if (void 0 === e) {
              let t = new Response('');
              if ('body' in t)
                try {
                  (new Response(t.body), (e = !0));
                } catch {
                  e = !1;
                }
              e = !1;
            }
            return e;
          })()
            ? await r.blob()
            : r.body;
        return new Response(o, c);
      },
      L = 'requests',
      F = 'queueName';
    class M {
      _db = null;
      async addEntry(e) {
        let t = (await this.getDb()).transaction(L, 'readwrite', { durability: 'relaxed' });
        (await t.store.add(e), await t.done);
      }
      async getFirstEntryId() {
        let e = await this.getDb(),
          t = await e.transaction(L).store.openCursor();
        return t?.value.id;
      }
      async getAllEntriesByQueueName(e) {
        let t = await this.getDb();
        return (await t.getAllFromIndex(L, F, IDBKeyRange.only(e))) || [];
      }
      async getEntryCountByQueueName(e) {
        return (await this.getDb()).countFromIndex(L, F, IDBKeyRange.only(e));
      }
      async deleteEntry(e) {
        let t = await this.getDb();
        await t.delete(L, e);
      }
      async getFirstEntryByQueueName(e) {
        return await this.getEndEntryFromIndex(IDBKeyRange.only(e), 'next');
      }
      async getLastEntryByQueueName(e) {
        return await this.getEndEntryFromIndex(IDBKeyRange.only(e), 'prev');
      }
      async getEndEntryFromIndex(e, t) {
        let a = await this.getDb(),
          s = await a.transaction(L).store.index(F).openCursor(e, t);
        return s?.value;
      }
      async getDb() {
        return (
          this._db ||
            (this._db = await E('serwist-background-sync', 3, { upgrade: this._upgradeDb })),
          this._db
        );
      }
      _upgradeDb(e, t) {
        (t > 0 && t < 3 && e.objectStoreNames.contains(L) && e.deleteObjectStore(L),
          e
            .createObjectStore(L, { autoIncrement: !0, keyPath: 'id' })
            .createIndex(F, F, { unique: !1 }));
      }
    }
    class O {
      _queueName;
      _queueDb;
      constructor(e) {
        ((this._queueName = e), (this._queueDb = new M()));
      }
      async pushEntry(e) {
        (delete e.id, (e.queueName = this._queueName), await this._queueDb.addEntry(e));
      }
      async unshiftEntry(e) {
        let t = await this._queueDb.getFirstEntryId();
        (t ? (e.id = t - 1) : delete e.id,
          (e.queueName = this._queueName),
          await this._queueDb.addEntry(e));
      }
      async popEntry() {
        return this._removeEntry(await this._queueDb.getLastEntryByQueueName(this._queueName));
      }
      async shiftEntry() {
        return this._removeEntry(await this._queueDb.getFirstEntryByQueueName(this._queueName));
      }
      async getAll() {
        return await this._queueDb.getAllEntriesByQueueName(this._queueName);
      }
      async size() {
        return await this._queueDb.getEntryCountByQueueName(this._queueName);
      }
      async deleteEntry(e) {
        await this._queueDb.deleteEntry(e);
      }
      async _removeEntry(e) {
        return (e && (await this.deleteEntry(e.id)), e);
      }
    }
    let B = [
      'method',
      'referrer',
      'referrerPolicy',
      'mode',
      'credentials',
      'cache',
      'redirect',
      'integrity',
      'keepalive',
    ];
    class K {
      _requestData;
      static async fromRequest(e) {
        let t = { url: e.url, headers: {} };
        for (let a of ('GET' !== e.method && (t.body = await e.clone().arrayBuffer()),
        e.headers.forEach((e, a) => {
          t.headers[a] = e;
        }),
        B))
          void 0 !== e[a] && (t[a] = e[a]);
        return new K(t);
      }
      constructor(e) {
        ('navigate' === e.mode && (e.mode = 'same-origin'), (this._requestData = e));
      }
      toObject() {
        let e = Object.assign({}, this._requestData);
        return (
          (e.headers = Object.assign({}, this._requestData.headers)),
          e.body && (e.body = e.body.slice(0)),
          e
        );
      }
      toRequest() {
        return new Request(this._requestData.url, this._requestData);
      }
      clone() {
        return new K(this.toObject());
      }
    }
    let W = 'serwist-background-sync',
      j = new Set(),
      $ = (e) => {
        let t = { request: new K(e.requestData).toRequest(), timestamp: e.timestamp };
        return (e.metadata && (t.metadata = e.metadata), t);
      };
    class H {
      _name;
      _onSync;
      _maxRetentionTime;
      _queueStore;
      _forceSyncFallback;
      _syncInProgress = !1;
      _requestsAddedDuringSync = !1;
      constructor(e, { forceSyncFallback: t, onSync: a, maxRetentionTime: s } = {}) {
        if (j.has(e)) throw new i('duplicate-queue-name', { name: e });
        (j.add(e),
          (this._name = e),
          (this._onSync = a || this.replayRequests),
          (this._maxRetentionTime = s || 10080),
          (this._forceSyncFallback = !!t),
          (this._queueStore = new O(this._name)),
          this._addSyncListener());
      }
      get name() {
        return this._name;
      }
      async pushRequest(e) {
        await this._addRequest(e, 'push');
      }
      async unshiftRequest(e) {
        await this._addRequest(e, 'unshift');
      }
      async popRequest() {
        return this._removeRequest('pop');
      }
      async shiftRequest() {
        return this._removeRequest('shift');
      }
      async getAll() {
        let e = await this._queueStore.getAll(),
          t = Date.now(),
          a = [];
        for (let s of e) {
          let e = 60 * this._maxRetentionTime * 1e3;
          t - s.timestamp > e ? await this._queueStore.deleteEntry(s.id) : a.push($(s));
        }
        return a;
      }
      async size() {
        return await this._queueStore.size();
      }
      async _addRequest({ request: e, metadata: t, timestamp: a = Date.now() }, s) {
        let r = { requestData: (await K.fromRequest(e.clone())).toObject(), timestamp: a };
        switch ((t && (r.metadata = t), s)) {
          case 'push':
            await this._queueStore.pushEntry(r);
            break;
          case 'unshift':
            await this._queueStore.unshiftEntry(r);
        }
        this._syncInProgress ? (this._requestsAddedDuringSync = !0) : await this.registerSync();
      }
      async _removeRequest(e) {
        let t,
          a = Date.now();
        switch (e) {
          case 'pop':
            t = await this._queueStore.popEntry();
            break;
          case 'shift':
            t = await this._queueStore.shiftEntry();
        }
        if (t) {
          let s = 60 * this._maxRetentionTime * 1e3;
          return a - t.timestamp > s ? this._removeRequest(e) : $(t);
        }
      }
      async replayRequests() {
        let e;
        for (; (e = await this.shiftRequest()); )
          try {
            await fetch(e.request.clone());
          } catch {
            throw (
              await this.unshiftRequest(e),
              new i('queue-replay-failed', { name: this._name })
            );
          }
      }
      async registerSync() {
        if ('sync' in self.registration && !this._forceSyncFallback)
          try {
            await self.registration.sync.register(`${W}:${this._name}`);
          } catch (e) {}
      }
      _addSyncListener() {
        'sync' in self.registration && !this._forceSyncFallback
          ? self.addEventListener('sync', (e) => {
              if (e.tag === `${W}:${this._name}`) {
                let t = async () => {
                  let t;
                  this._syncInProgress = !0;
                  try {
                    await this._onSync({ queue: this });
                  } catch (e) {
                    if (e instanceof Error) throw e;
                  } finally {
                    (this._requestsAddedDuringSync &&
                      !(t && !e.lastChance) &&
                      (await this.registerSync()),
                      (this._syncInProgress = !1),
                      (this._requestsAddedDuringSync = !1));
                  }
                };
                e.waitUntil(t());
              }
            })
          : this._onSync({ queue: this });
      }
      static get _queueNames() {
        return j;
      }
    }
    class G {
      _queue;
      constructor(e, t) {
        this._queue = new H(e, t);
      }
      async fetchDidFail({ request: e }) {
        await this._queue.pushRequest({ request: e });
      }
    }
    let Q = {
      cacheWillUpdate: async ({ response: e }) => (200 === e.status || 0 === e.status ? e : null),
    };
    function V(e) {
      return 'string' == typeof e ? new Request(e) : e;
    }
    class z {
      event;
      request;
      url;
      params;
      _cacheKeys = {};
      _strategy;
      _handlerDeferred;
      _extendLifetimePromises;
      _plugins;
      _pluginStateMap;
      constructor(e, t) {
        for (let a of ((this.event = t.event),
        (this.request = t.request),
        t.url && ((this.url = t.url), (this.params = t.params)),
        (this._strategy = e),
        (this._handlerDeferred = new u()),
        (this._extendLifetimePromises = []),
        (this._plugins = [...e.plugins]),
        (this._pluginStateMap = new Map()),
        this._plugins))
          this._pluginStateMap.set(a, {});
        this.event.waitUntil(this._handlerDeferred.promise);
      }
      async fetch(e) {
        let { event: t } = this,
          a = V(e),
          s = await this.getPreloadResponse();
        if (s) return s;
        let r = this.hasCallback('fetchDidFail') ? a.clone() : null;
        try {
          for (let e of this.iterateCallbacks('requestWillFetch'))
            a = await e({ request: a.clone(), event: t });
        } catch (e) {
          if (e instanceof Error)
            throw new i('plugin-error-request-will-fetch', { thrownErrorMessage: e.message });
        }
        let n = a.clone();
        try {
          let e;
          for (let s of ((e = await fetch(
            a,
            'navigate' === a.mode ? void 0 : this._strategy.fetchOptions
          )),
          this.iterateCallbacks('fetchDidSucceed')))
            e = await s({ event: t, request: n, response: e });
          return e;
        } catch (e) {
          throw (
            r &&
              (await this.runCallbacks('fetchDidFail', {
                error: e,
                event: t,
                originalRequest: r.clone(),
                request: n.clone(),
              })),
            e
          );
        }
      }
      async fetchAndCachePut(e) {
        let t = await this.fetch(e),
          a = t.clone();
        return (this.waitUntil(this.cachePut(e, a)), t);
      }
      async cacheMatch(e) {
        let t,
          a = V(e),
          { cacheName: s, matchOptions: r } = this._strategy,
          n = await this.getCacheKey(a, 'read'),
          i = { ...r, cacheName: s };
        for (let e of ((t = await caches.match(n, i)),
        this.iterateCallbacks('cachedResponseWillBeUsed')))
          t =
            (await e({
              cacheName: s,
              matchOptions: r,
              cachedResponse: t,
              request: n,
              event: this.event,
            })) || void 0;
        return t;
      }
      async cachePut(e, t) {
        let a = V(e);
        await c(0);
        let s = await this.getCacheKey(a, 'write');
        if (!t)
          throw new i('cache-put-with-no-response', {
            url: new URL(String(s.url), location.href).href.replace(
              RegExp(`^${location.origin}`),
              ''
            ),
          });
        let r = await this._ensureResponseSafeToCache(t);
        if (!r) return !1;
        let { cacheName: n, matchOptions: o } = this._strategy,
          l = await self.caches.open(n),
          u = this.hasCallback('cacheDidUpdate'),
          m = u ? await h(l, s.clone(), ['__WB_REVISION__'], o) : null;
        try {
          await l.put(s, u ? r.clone() : r);
        } catch (e) {
          if (e instanceof Error) throw ('QuotaExceededError' === e.name && (await d()), e);
        }
        for (let e of this.iterateCallbacks('cacheDidUpdate'))
          await e({
            cacheName: n,
            oldResponse: m,
            newResponse: r.clone(),
            request: s,
            event: this.event,
          });
        return !0;
      }
      async getCacheKey(e, t) {
        let a = `${e.url} | ${t}`;
        if (!this._cacheKeys[a]) {
          let s = e;
          for (let e of this.iterateCallbacks('cacheKeyWillBeUsed'))
            s = V(await e({ mode: t, request: s, event: this.event, params: this.params }));
          this._cacheKeys[a] = s;
        }
        return this._cacheKeys[a];
      }
      hasCallback(e) {
        for (let t of this._strategy.plugins) if (e in t) return !0;
        return !1;
      }
      async runCallbacks(e, t) {
        for (let a of this.iterateCallbacks(e)) await a(t);
      }
      *iterateCallbacks(e) {
        for (let t of this._strategy.plugins)
          if ('function' == typeof t[e]) {
            let a = this._pluginStateMap.get(t),
              s = (s) => {
                let r = { ...s, state: a };
                return t[e](r);
              };
            yield s;
          }
      }
      waitUntil(e) {
        return (this._extendLifetimePromises.push(e), e);
      }
      async doneWaiting() {
        let e;
        for (; (e = this._extendLifetimePromises.shift()); ) await e;
      }
      destroy() {
        this._handlerDeferred.resolve(null);
      }
      async getPreloadResponse() {
        if (
          this.event instanceof FetchEvent &&
          'navigate' === this.event.request.mode &&
          'preloadResponse' in this.event
        )
          try {
            let e = await this.event.preloadResponse;
            if (e) return e;
          } catch (e) {}
      }
      async _ensureResponseSafeToCache(e) {
        let t = e,
          a = !1;
        for (let e of this.iterateCallbacks('cacheWillUpdate'))
          if (
            ((t = (await e({ request: this.request, response: t, event: this.event })) || void 0),
            (a = !0),
            !t)
          )
            break;
        return (!a && t && 200 !== t.status && (t = void 0), t);
      }
    }
    class J {
      cacheName;
      plugins;
      fetchOptions;
      matchOptions;
      constructor(e = {}) {
        ((this.cacheName = n.getRuntimeName(e.cacheName)),
          (this.plugins = e.plugins || []),
          (this.fetchOptions = e.fetchOptions),
          (this.matchOptions = e.matchOptions));
      }
      handle(e) {
        let [t] = this.handleAll(e);
        return t;
      }
      handleAll(e) {
        e instanceof FetchEvent && (e = { event: e, request: e.request });
        let t = e.event,
          a = 'string' == typeof e.request ? new Request(e.request) : e.request,
          s = new z(
            this,
            e.url
              ? { event: t, request: a, url: e.url, params: e.params }
              : { event: t, request: a }
          ),
          r = this._getResponse(s, a, t),
          n = this._awaitComplete(r, s, a, t);
        return [r, n];
      }
      async _getResponse(e, t, a) {
        let s;
        await e.runCallbacks('handlerWillStart', { event: a, request: t });
        try {
          if (((s = await this._handle(t, e)), void 0 === s || 'error' === s.type))
            throw new i('no-response', { url: t.url });
        } catch (r) {
          if (r instanceof Error) {
            for (let n of e.iterateCallbacks('handlerDidError'))
              if (void 0 !== (s = await n({ error: r, event: a, request: t }))) break;
          }
          if (!s) throw r;
        }
        for (let r of e.iterateCallbacks('handlerWillRespond'))
          s = await r({ event: a, request: t, response: s });
        return s;
      }
      async _awaitComplete(e, t, a, s) {
        let r, n;
        try {
          r = await e;
        } catch {}
        try {
          (await t.runCallbacks('handlerDidRespond', { event: s, request: a, response: r }),
            await t.doneWaiting());
        } catch (e) {
          e instanceof Error && (n = e);
        }
        if (
          (await t.runCallbacks('handlerDidComplete', {
            event: s,
            request: a,
            response: r,
            error: n,
          }),
          t.destroy(),
          n)
        )
          throw n;
      }
    }
    class X extends J {
      _networkTimeoutSeconds;
      constructor(e = {}) {
        (super(e),
          this.plugins.some((e) => 'cacheWillUpdate' in e) || this.plugins.unshift(Q),
          (this._networkTimeoutSeconds = e.networkTimeoutSeconds || 0));
      }
      async _handle(e, t) {
        let a,
          s = [],
          r = [];
        if (this._networkTimeoutSeconds) {
          let { id: n, promise: i } = this._getTimeoutPromise({ request: e, logs: s, handler: t });
          ((a = n), r.push(i));
        }
        let n = this._getNetworkPromise({ timeoutId: a, request: e, logs: s, handler: t });
        r.push(n);
        let c = await t.waitUntil(
          (async () => (await t.waitUntil(Promise.race(r))) || (await n))()
        );
        if (!c) throw new i('no-response', { url: e.url });
        return c;
      }
      _getTimeoutPromise({ request: e, logs: t, handler: a }) {
        let s;
        return {
          promise: new Promise((t) => {
            s = setTimeout(async () => {
              t(await a.cacheMatch(e));
            }, 1e3 * this._networkTimeoutSeconds);
          }),
          id: s,
        };
      }
      async _getNetworkPromise({ timeoutId: e, request: t, logs: a, handler: s }) {
        let r, n;
        try {
          n = await s.fetchAndCachePut(t);
        } catch (e) {
          e instanceof Error && (r = e);
        }
        return (e && clearTimeout(e), (r || !n) && (n = await s.cacheMatch(t)), n);
      }
    }
    class Y extends J {
      _networkTimeoutSeconds;
      constructor(e = {}) {
        (super(e), (this._networkTimeoutSeconds = e.networkTimeoutSeconds || 0));
      }
      async _handle(e, t) {
        let a, s;
        try {
          let a = [t.fetch(e)];
          if (this._networkTimeoutSeconds) {
            let e = c(1e3 * this._networkTimeoutSeconds);
            a.push(e);
          }
          if (!(s = await Promise.race(a)))
            throw Error(
              `Timed out the network response after ${this._networkTimeoutSeconds} seconds.`
            );
        } catch (e) {
          e instanceof Error && (a = e);
        }
        if (!s) throw new i('no-response', { url: e.url, error: a });
        return s;
      }
    }
    let Z = (e) => (e && 'object' == typeof e ? e : { handle: e });
    class ee {
      handler;
      match;
      method;
      catchHandler;
      constructor(e, t, a = 'GET') {
        ((this.handler = Z(t)), (this.match = e), (this.method = a));
      }
      setCatchHandler(e) {
        this.catchHandler = Z(e);
      }
    }
    class et extends J {
      _fallbackToNetwork;
      static defaultPrecacheCacheabilityPlugin = {
        cacheWillUpdate: async ({ response: e }) => (!e || e.status >= 400 ? null : e),
      };
      static copyRedirectedCacheableResponsesPlugin = {
        cacheWillUpdate: async ({ response: e }) => (e.redirected ? await U(e) : e),
      };
      constructor(e = {}) {
        ((e.cacheName = n.getPrecacheName(e.cacheName)),
          super(e),
          (this._fallbackToNetwork = !1 !== e.fallbackToNetwork),
          this.plugins.push(et.copyRedirectedCacheableResponsesPlugin));
      }
      async _handle(e, t) {
        let a = await t.getPreloadResponse();
        if (a) return a;
        let s = await t.cacheMatch(e);
        return (
          s ||
          (t.event && 'install' === t.event.type
            ? await this._handleInstall(e, t)
            : await this._handleFetch(e, t))
        );
      }
      async _handleFetch(e, t) {
        let a,
          s = t.params || {};
        if (this._fallbackToNetwork) {
          let r = s.integrity,
            n = e.integrity,
            i = !n || n === r;
          ((a = await t.fetch(
            new Request(e, { integrity: 'no-cors' !== e.mode ? n || r : void 0 })
          )),
            r &&
              i &&
              'no-cors' !== e.mode &&
              (this._useDefaultCacheabilityPluginIfNeeded(), await t.cachePut(e, a.clone())));
        } else throw new i('missing-precache-entry', { cacheName: this.cacheName, url: e.url });
        return a;
      }
      async _handleInstall(e, t) {
        this._useDefaultCacheabilityPluginIfNeeded();
        let a = await t.fetch(e);
        if (!(await t.cachePut(e, a.clone())))
          throw new i('bad-precaching-response', { url: e.url, status: a.status });
        return a;
      }
      _useDefaultCacheabilityPluginIfNeeded() {
        let e = null,
          t = 0;
        for (let [a, s] of this.plugins.entries())
          s !== et.copyRedirectedCacheableResponsesPlugin &&
            (s === et.defaultPrecacheCacheabilityPlugin && (e = a), s.cacheWillUpdate && t++);
        0 === t
          ? this.plugins.push(et.defaultPrecacheCacheabilityPlugin)
          : t > 1 && null !== e && this.plugins.splice(e, 1);
      }
    }
    class ea extends ee {
      _allowlist;
      _denylist;
      constructor(e, { allowlist: t = [/./], denylist: a = [] } = {}) {
        (super((e) => this._match(e), e), (this._allowlist = t), (this._denylist = a));
      }
      _match({ url: e, request: t }) {
        if (t && 'navigate' !== t.mode) return !1;
        let a = e.pathname + e.search;
        for (let e of this._denylist) if (e.test(a)) return !1;
        return !!this._allowlist.some((e) => e.test(a));
      }
    }
    class es extends ee {
      constructor(e, t, a) {
        super(
          ({ url: t }) => {
            let a = e.exec(t.href);
            if (a) return t.origin !== location.origin && 0 !== a.index ? void 0 : a.slice(1);
          },
          t,
          a
        );
      }
    }
    let er = (e) => {
      if (!e) throw new i('add-to-cache-list-unexpected-type', { entry: e });
      if ('string' == typeof e) {
        let t = new URL(e, location.href);
        return { cacheKey: t.href, url: t.href };
      }
      let { revision: t, url: a } = e;
      if (!a) throw new i('add-to-cache-list-unexpected-type', { entry: e });
      if (!t) {
        let e = new URL(a, location.href);
        return { cacheKey: e.href, url: e.href };
      }
      let s = new URL(a, location.href),
        r = new URL(a, location.href);
      return (s.searchParams.set('__WB_REVISION__', t), { cacheKey: s.href, url: r.href });
    };
    class en {
      updatedURLs = [];
      notUpdatedURLs = [];
      handlerWillStart = async ({ request: e, state: t }) => {
        t && (t.originalRequest = e);
      };
      cachedResponseWillBeUsed = async ({ event: e, state: t, cachedResponse: a }) => {
        if ('install' === e.type && t?.originalRequest && t.originalRequest instanceof Request) {
          let e = t.originalRequest.url;
          a ? this.notUpdatedURLs.push(e) : this.updatedURLs.push(e);
        }
        return a;
      };
    }
    let ei = async (e, t, a) => {
      let s = t.map((e, t) => ({ index: t, item: e })),
        r = async (e) => {
          let t = [];
          for (;;) {
            let r = s.pop();
            if (!r) return e(t);
            let n = await a(r.item);
            t.push({ result: n, index: r.index });
          }
        },
        n = Array.from({ length: e }, () => new Promise(r));
      return (await Promise.all(n))
        .flat()
        .sort((e, t) => (e.index < t.index ? -1 : 1))
        .map((e) => e.result);
    };
    'undefined' != typeof navigator && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    let ec = 'cache-entries',
      eo = (e) => {
        let t = new URL(e, location.href);
        return ((t.hash = ''), t.href);
      };
    class el {
      _cacheName;
      _db = null;
      constructor(e) {
        this._cacheName = e;
      }
      _getId(e) {
        return `${this._cacheName}|${eo(e)}`;
      }
      _upgradeDb(e) {
        let t = e.createObjectStore(ec, { keyPath: 'id' });
        (t.createIndex('cacheName', 'cacheName', { unique: !1 }),
          t.createIndex('timestamp', 'timestamp', { unique: !1 }));
      }
      _upgradeDbAndDeleteOldDbs(e) {
        (this._upgradeDb(e),
          this._cacheName &&
            (function (e, { blocked: t } = {}) {
              let a = indexedDB.deleteDatabase(e);
              (t && a.addEventListener('blocked', (e) => t(e.oldVersion, e)),
                x(a).then(() => void 0));
            })(this._cacheName));
      }
      async setTimestamp(e, t) {
        e = eo(e);
        let a = { id: this._getId(e), cacheName: this._cacheName, url: e, timestamp: t },
          s = (await this.getDb()).transaction(ec, 'readwrite', { durability: 'relaxed' });
        (await s.store.put(a), await s.done);
      }
      async getTimestamp(e) {
        let t = await this.getDb(),
          a = await t.get(ec, this._getId(e));
        return a?.timestamp;
      }
      async expireEntries(e, t) {
        let a = await this.getDb(),
          s = await a
            .transaction(ec, 'readwrite')
            .store.index('timestamp')
            .openCursor(null, 'prev'),
          r = [],
          n = 0;
        for (; s; ) {
          let a = s.value;
          (a.cacheName === this._cacheName &&
            ((e && a.timestamp < e) || (t && n >= t) ? (s.delete(), r.push(a.url)) : n++),
            (s = await s.continue()));
        }
        return r;
      }
      async getDb() {
        return (
          this._db ||
            (this._db = await E('serwist-expiration', 1, {
              upgrade: this._upgradeDbAndDeleteOldDbs.bind(this),
            })),
          this._db
        );
      }
    }
    class eh {
      _isRunning = !1;
      _rerunRequested = !1;
      _maxEntries;
      _maxAgeSeconds;
      _matchOptions;
      _cacheName;
      _timestampModel;
      constructor(e, t = {}) {
        ((this._maxEntries = t.maxEntries),
          (this._maxAgeSeconds = t.maxAgeSeconds),
          (this._matchOptions = t.matchOptions),
          (this._cacheName = e),
          (this._timestampModel = new el(e)));
      }
      async expireEntries() {
        if (this._isRunning) {
          this._rerunRequested = !0;
          return;
        }
        this._isRunning = !0;
        let e = this._maxAgeSeconds ? Date.now() - 1e3 * this._maxAgeSeconds : 0,
          t = await this._timestampModel.expireEntries(e, this._maxEntries),
          a = await self.caches.open(this._cacheName);
        for (let e of t) await a.delete(e, this._matchOptions);
        ((this._isRunning = !1),
          this._rerunRequested && ((this._rerunRequested = !1), this.expireEntries()));
      }
      async updateTimestamp(e) {
        await this._timestampModel.setTimestamp(e, Date.now());
      }
      async isURLExpired(e) {
        if (!this._maxAgeSeconds) return !1;
        let t = await this._timestampModel.getTimestamp(e),
          a = Date.now() - 1e3 * this._maxAgeSeconds;
        return void 0 === t || t < a;
      }
      async delete() {
        ((this._rerunRequested = !1), await this._timestampModel.expireEntries(1 / 0));
      }
    }
    class eu {
      _config;
      _cacheExpirations;
      constructor(e = {}) {
        var t;
        ((this._config = e),
          (this._cacheExpirations = new Map()),
          this._config.maxAgeFrom || (this._config.maxAgeFrom = 'last-fetched'),
          this._config.purgeOnQuotaError && ((t = () => this.deleteCacheAndMetadata()), o.add(t)));
      }
      _getCacheExpiration(e) {
        if (e === n.getRuntimeName()) throw new i('expire-custom-caches-only');
        let t = this._cacheExpirations.get(e);
        return (t || ((t = new eh(e, this._config)), this._cacheExpirations.set(e, t)), t);
      }
      cachedResponseWillBeUsed({ event: e, cacheName: t, request: a, cachedResponse: s }) {
        if (!s) return null;
        let r = this._isResponseDateFresh(s),
          n = this._getCacheExpiration(t),
          i = 'last-used' === this._config.maxAgeFrom,
          c = (async () => {
            (i && (await n.updateTimestamp(a.url)), await n.expireEntries());
          })();
        try {
          e.waitUntil(c);
        } catch {}
        return r ? s : null;
      }
      _isResponseDateFresh(e) {
        if ('last-used' === this._config.maxAgeFrom) return !0;
        let t = Date.now();
        if (!this._config.maxAgeSeconds) return !0;
        let a = this._getDateHeaderTimestamp(e);
        return null === a || a >= t - 1e3 * this._config.maxAgeSeconds;
      }
      _getDateHeaderTimestamp(e) {
        if (!e.headers.has('date')) return null;
        let t = new Date(e.headers.get('date')).getTime();
        return Number.isNaN(t) ? null : t;
      }
      async cacheDidUpdate({ cacheName: e, request: t }) {
        let a = this._getCacheExpiration(e);
        (await a.updateTimestamp(t.url), await a.expireEntries());
      }
      async deleteCacheAndMetadata() {
        for (let [e, t] of this._cacheExpirations) (await self.caches.delete(e), await t.delete());
        this._cacheExpirations = new Map();
      }
    }
    let ed = 'www.google-analytics.com',
      em = 'www.googletagmanager.com',
      ef = /^\/(\w+\/)?collect/,
      eg = ({ serwist: e, cacheName: t, ...a }) => {
        let s = n.getGoogleAnalyticsName(t),
          r = new G('serwist-google-analytics', {
            maxRetentionTime: 2880,
            onSync: (
              (e) =>
              async ({ queue: t }) => {
                let a;
                for (; (a = await t.shiftRequest()); ) {
                  let { request: s, timestamp: r } = a,
                    n = new URL(s.url);
                  try {
                    let t =
                        'POST' === s.method
                          ? new URLSearchParams(await s.clone().text())
                          : n.searchParams,
                      a = r - (Number(t.get('qt')) || 0),
                      i = Date.now() - a;
                    if ((t.set('qt', String(i)), e.parameterOverrides))
                      for (let a of Object.keys(e.parameterOverrides)) {
                        let s = e.parameterOverrides[a];
                        t.set(a, s);
                      }
                    ('function' == typeof e.hitFilter && e.hitFilter.call(null, t),
                      await fetch(
                        new Request(n.origin + n.pathname, {
                          body: t.toString(),
                          method: 'POST',
                          mode: 'cors',
                          credentials: 'omit',
                          headers: { 'Content-Type': 'text/plain' },
                        })
                      ));
                  } catch (e) {
                    throw (await t.unshiftRequest(a), e);
                  }
                }
              }
            )(a),
          });
        for (let t of [
          new ee(
            ({ url: e }) => e.hostname === em && '/gtm.js' === e.pathname,
            new X({ cacheName: s }),
            'GET'
          ),
          new ee(
            ({ url: e }) => e.hostname === ed && '/analytics.js' === e.pathname,
            new X({ cacheName: s }),
            'GET'
          ),
          new ee(
            ({ url: e }) => e.hostname === em && '/gtag/js' === e.pathname,
            new X({ cacheName: s }),
            'GET'
          ),
          ...((e) => {
            let t = ({ url: e }) => e.hostname === ed && ef.test(e.pathname),
              a = new Y({ plugins: [e] });
            return [new ee(t, a, 'GET'), new ee(t, a, 'POST')];
          })(r),
        ])
          e.registerRoute(t);
      };
    class ew {
      _fallbackUrls;
      _serwist;
      constructor({ fallbackUrls: e, serwist: t }) {
        ((this._fallbackUrls = e), (this._serwist = t));
      }
      async handlerDidError(e) {
        for (let t of this._fallbackUrls)
          if ('string' == typeof t) {
            let e = await this._serwist.matchPrecache(t);
            if (void 0 !== e) return e;
          } else if (t.matcher(e)) {
            let e = await this._serwist.matchPrecache(t.url);
            if (void 0 !== e) return e;
          }
      }
    }
    let ep = async (e, t) => {
      try {
        if (206 === t.status) return t;
        let a = e.headers.get('range');
        if (!a) throw new i('no-range-header');
        let s = ((e) => {
            let t = e.trim().toLowerCase();
            if (!t.startsWith('bytes='))
              throw new i('unit-must-be-bytes', { normalizedRangeHeader: t });
            if (t.includes(',')) throw new i('single-range-only', { normalizedRangeHeader: t });
            let a = /(\d*)-(\d*)/.exec(t);
            if (!a || !(a[1] || a[2]))
              throw new i('invalid-range-values', { normalizedRangeHeader: t });
            return {
              start: '' === a[1] ? void 0 : Number(a[1]),
              end: '' === a[2] ? void 0 : Number(a[2]),
            };
          })(a),
          r = await t.blob(),
          n = ((e, t, a) => {
            let s,
              r,
              n = e.size;
            if ((a && a > n) || (t && t < 0))
              throw new i('range-not-satisfiable', { size: n, end: a, start: t });
            return (
              void 0 !== t && void 0 !== a
                ? ((s = t), (r = a + 1))
                : void 0 !== t && void 0 === a
                  ? ((s = t), (r = n))
                  : void 0 !== a && void 0 === t && ((s = n - a), (r = n)),
              { start: s, end: r }
            );
          })(r, s.start, s.end),
          c = r.slice(n.start, n.end),
          o = c.size,
          l = new Response(c, { status: 206, statusText: 'Partial Content', headers: t.headers });
        return (
          l.headers.set('Content-Length', String(o)),
          l.headers.set('Content-Range', `bytes ${n.start}-${n.end - 1}/${r.size}`),
          l
        );
      } catch (e) {
        return new Response('', { status: 416, statusText: 'Range Not Satisfiable' });
      }
    };
    class ey {
      cachedResponseWillBeUsed = async ({ request: e, cachedResponse: t }) =>
        t && e.headers.has('range') ? await ep(e, t) : t;
    }
    class e_ extends J {
      async _handle(e, t) {
        let a,
          s = await t.cacheMatch(e);
        if (!s)
          try {
            s = await t.fetchAndCachePut(e);
          } catch (e) {
            e instanceof Error && (a = e);
          }
        if (!s) throw new i('no-response', { url: e.url, error: a });
        return s;
      }
    }
    class eb extends J {
      constructor(e = {}) {
        (super(e), this.plugins.some((e) => 'cacheWillUpdate' in e) || this.plugins.unshift(Q));
      }
      async _handle(e, t) {
        let a,
          s = t.fetchAndCachePut(e).catch(() => {});
        t.waitUntil(s);
        let r = await t.cacheMatch(e);
        if (r);
        else
          try {
            r = await s;
          } catch (e) {
            e instanceof Error && (a = e);
          }
        if (!r) throw new i('no-response', { url: e.url, error: a });
        return r;
      }
    }
    class ex extends ee {
      constructor(e, t) {
        super(({ request: a }) => {
          let s = e.getUrlsToPrecacheKeys();
          for (let r of (function* (
            e,
            {
              directoryIndex: t = 'index.html',
              ignoreURLParametersMatching: a = [/^utm_/, /^fbclid$/],
              cleanURLs: s = !0,
              urlManipulation: r,
            } = {}
          ) {
            let n = new URL(e, location.href);
            ((n.hash = ''), yield n.href);
            let i = ((e, t = []) => {
              for (let a of [...e.searchParams.keys()])
                t.some((e) => e.test(a)) && e.searchParams.delete(a);
              return e;
            })(n, a);
            if ((yield i.href, t && i.pathname.endsWith('/'))) {
              let e = new URL(i.href);
              ((e.pathname += t), yield e.href);
            }
            if (s) {
              let e = new URL(i.href);
              ((e.pathname += '.html'), yield e.href);
            }
            if (r) for (let e of r({ url: n })) yield e.href;
          })(a.url, t)) {
            let t = s.get(r);
            if (t) {
              let a = e.getIntegrityForPrecacheKey(t);
              return { cacheKey: t, integrity: a };
            }
          }
        }, e.precacheStrategy);
      }
    }
    class eR {
      _precacheController;
      constructor({ precacheController: e }) {
        this._precacheController = e;
      }
      cacheKeyWillBeUsed = async ({ request: e, params: t }) => {
        let a = t?.cacheKey || this._precacheController.getPrecacheKeyForUrl(e.url);
        return a ? new Request(a, { headers: e.headers }) : e;
      };
    }
    class eE {
      _urlsToCacheKeys = new Map();
      _urlsToCacheModes = new Map();
      _cacheKeysToIntegrities = new Map();
      _concurrentPrecaching;
      _precacheStrategy;
      _routes;
      _defaultHandlerMap;
      _catchHandler;
      _requestRules;
      constructor({
        precacheEntries: e,
        precacheOptions: t,
        skipWaiting: a = !1,
        importScripts: s,
        navigationPreload: r = !1,
        cacheId: i,
        clientsClaim: c = !1,
        runtimeCaching: o,
        offlineAnalyticsConfig: l,
        disableDevLogs: h = !1,
        fallbacks: u,
        requestRules: d,
      } = {}) {
        var m, g;
        let {
          precacheStrategyOptions: w,
          precacheRouteOptions: p,
          precacheMiscOptions: y,
        } = ((e, t = {}) => {
          let {
            cacheName: a,
            plugins: s = [],
            fetchOptions: r,
            matchOptions: i,
            fallbackToNetwork: c,
            directoryIndex: o,
            ignoreURLParametersMatching: l,
            cleanURLs: h,
            urlManipulation: u,
            cleanupOutdatedCaches: d,
            concurrency: m = 10,
            navigateFallback: f,
            navigateFallbackAllowlist: g,
            navigateFallbackDenylist: w,
          } = t ?? {};
          return {
            precacheStrategyOptions: {
              cacheName: n.getPrecacheName(a),
              plugins: [...s, new eR({ precacheController: e })],
              fetchOptions: r,
              matchOptions: i,
              fallbackToNetwork: c,
            },
            precacheRouteOptions: {
              directoryIndex: o,
              ignoreURLParametersMatching: l,
              cleanURLs: h,
              urlManipulation: u,
            },
            precacheMiscOptions: {
              cleanupOutdatedCaches: d,
              concurrency: m,
              navigateFallback: f,
              navigateFallbackAllowlist: g,
              navigateFallbackDenylist: w,
            },
          };
        })(this, t);
        if (
          ((this._concurrentPrecaching = y.concurrency),
          (this._precacheStrategy = new et(w)),
          (this._routes = new Map()),
          (this._defaultHandlerMap = new Map()),
          (this._requestRules = d),
          (this.handleInstall = this.handleInstall.bind(this)),
          (this.handleActivate = this.handleActivate.bind(this)),
          (this.handleFetch = this.handleFetch.bind(this)),
          (this.handleCache = this.handleCache.bind(this)),
          s && s.length > 0 && self.importScripts(...s),
          r &&
            self.registration?.navigationPreload &&
            self.addEventListener('activate', (e) => {
              e.waitUntil(self.registration.navigationPreload.enable().then(() => {}));
            }),
          void 0 !== i && ((m = { prefix: i }), n.updateDetails(m)),
          a
            ? self.skipWaiting()
            : self.addEventListener('message', (e) => {
                e.data && 'SKIP_WAITING' === e.data.type && self.skipWaiting();
              }),
          c && self.addEventListener('activate', () => self.clients.claim()),
          e && e.length > 0 && this.addToPrecacheList(e),
          y.cleanupOutdatedCaches &&
            ((g = w.cacheName),
            self.addEventListener('activate', (e) => {
              e.waitUntil(f(n.getPrecacheName(g)).then((e) => {}));
            })),
          this.registerRoute(new ex(this, p)),
          y.navigateFallback &&
            this.registerRoute(
              new ea(this.createHandlerBoundToUrl(y.navigateFallback), {
                allowlist: y.navigateFallbackAllowlist,
                denylist: y.navigateFallbackDenylist,
              })
            ),
          void 0 !== l &&
            ('boolean' == typeof l ? l && eg({ serwist: this }) : eg({ ...l, serwist: this })),
          void 0 !== o)
        ) {
          if (void 0 !== u) {
            let e = new ew({ fallbackUrls: u.entries, serwist: this });
            o.forEach((t) => {
              t.handler instanceof J &&
                !t.handler.plugins.some((e) => 'handlerDidError' in e) &&
                t.handler.plugins.push(e);
            });
          }
          for (let e of o) this.registerCapture(e.matcher, e.handler, e.method);
        }
        h && (self.__WB_DISABLE_DEV_LOGS = !0);
      }
      get precacheStrategy() {
        return this._precacheStrategy;
      }
      get routes() {
        return this._routes;
      }
      addEventListeners() {
        (self.addEventListener('install', this.handleInstall),
          self.addEventListener('activate', this.handleActivate),
          self.addEventListener('fetch', this.handleFetch),
          self.addEventListener('message', this.handleCache));
      }
      addToPrecacheList(e) {
        let t = [];
        for (let a of e) {
          'string' == typeof a
            ? t.push(a)
            : a && !a.integrity && void 0 === a.revision && t.push(a.url);
          let { cacheKey: e, url: s } = er(a),
            r = 'string' != typeof a && a.revision ? 'reload' : 'default';
          if (this._urlsToCacheKeys.has(s) && this._urlsToCacheKeys.get(s) !== e)
            throw new i('add-to-cache-list-conflicting-entries', {
              firstEntry: this._urlsToCacheKeys.get(s),
              secondEntry: e,
            });
          if ('string' != typeof a && a.integrity) {
            if (
              this._cacheKeysToIntegrities.has(e) &&
              this._cacheKeysToIntegrities.get(e) !== a.integrity
            )
              throw new i('add-to-cache-list-conflicting-integrities', { url: s });
            this._cacheKeysToIntegrities.set(e, a.integrity);
          }
          (this._urlsToCacheKeys.set(s, e), this._urlsToCacheModes.set(s, r));
        }
        t.length > 0 &&
          console.warn(`Serwist is precaching URLs without revision info: ${t.join(', ')}
This is generally NOT safe. Learn more at https://bit.ly/wb-precache`);
      }
      handleInstall(e) {
        return (
          this.registerRequestRules(e),
          g(e, async () => {
            let t = new en();
            (this.precacheStrategy.plugins.push(t),
              await ei(
                this._concurrentPrecaching,
                Array.from(this._urlsToCacheKeys.entries()),
                async ([t, a]) => {
                  let s = this._cacheKeysToIntegrities.get(a),
                    r = this._urlsToCacheModes.get(t),
                    n = new Request(t, { integrity: s, cache: r, credentials: 'same-origin' });
                  await Promise.all(
                    this.precacheStrategy.handleAll({
                      event: e,
                      request: n,
                      url: new URL(n.url),
                      params: { cacheKey: a },
                    })
                  );
                }
              ));
            let { updatedURLs: a, notUpdatedURLs: s } = t;
            return { updatedURLs: a, notUpdatedURLs: s };
          })
        );
      }
      async registerRequestRules(e) {
        if (this._requestRules && e?.addRoutes)
          try {
            (await e.addRoutes(this._requestRules), (this._requestRules = void 0));
          } catch (e) {
            throw e;
          }
      }
      handleActivate(e) {
        return g(e, async () => {
          let e = await self.caches.open(this.precacheStrategy.cacheName),
            t = await e.keys(),
            a = new Set(this._urlsToCacheKeys.values()),
            s = [];
          for (let r of t) a.has(r.url) || (await e.delete(r), s.push(r.url));
          return { deletedCacheRequests: s };
        });
      }
      handleFetch(e) {
        let { request: t } = e,
          a = this.handleRequest({ request: t, event: e });
        a && e.respondWith(a);
      }
      handleCache(e) {
        if (e.data && 'CACHE_URLS' === e.data.type) {
          let { payload: t } = e.data,
            a = Promise.all(
              t.urlsToCache.map((t) => {
                let a;
                return (
                  (a = 'string' == typeof t ? new Request(t) : new Request(...t)),
                  this.handleRequest({ request: a, event: e })
                );
              })
            );
          (e.waitUntil(a), e.ports?.[0] && a.then(() => e.ports[0].postMessage(!0)));
        }
      }
      setDefaultHandler(e, t = 'GET') {
        this._defaultHandlerMap.set(t, Z(e));
      }
      setCatchHandler(e) {
        this._catchHandler = Z(e);
      }
      registerCapture(e, t, a) {
        let s = ((e, t, a) => {
          if ('string' == typeof e) {
            let s = new URL(e, location.href);
            return new ee(({ url: e }) => e.href === s.href, t, a);
          }
          if (e instanceof RegExp) return new es(e, t, a);
          if ('function' == typeof e) return new ee(e, t, a);
          if (e instanceof ee) return e;
          throw new i('unsupported-route-type', {
            moduleName: 'serwist',
            funcName: 'parseRoute',
            paramName: 'capture',
          });
        })(e, t, a);
        return (this.registerRoute(s), s);
      }
      registerRoute(e) {
        (this._routes.has(e.method) || this._routes.set(e.method, []),
          this._routes.get(e.method).push(e));
      }
      unregisterRoute(e) {
        if (!this._routes.has(e.method))
          throw new i('unregister-route-but-not-found-with-method', { method: e.method });
        let t = this._routes.get(e.method).indexOf(e);
        if (t > -1) this._routes.get(e.method).splice(t, 1);
        else throw new i('unregister-route-route-not-registered');
      }
      getUrlsToPrecacheKeys() {
        return this._urlsToCacheKeys;
      }
      getPrecachedUrls() {
        return [...this._urlsToCacheKeys.keys()];
      }
      getPrecacheKeyForUrl(e) {
        let t = new URL(e, location.href);
        return this._urlsToCacheKeys.get(t.href);
      }
      getIntegrityForPrecacheKey(e) {
        return this._cacheKeysToIntegrities.get(e);
      }
      async matchPrecache(e) {
        let t = e instanceof Request ? e.url : e,
          a = this.getPrecacheKeyForUrl(t);
        if (a) return (await self.caches.open(this.precacheStrategy.cacheName)).match(a);
      }
      createHandlerBoundToUrl(e) {
        let t = this.getPrecacheKeyForUrl(e);
        if (!t) throw new i('non-precached-url', { url: e });
        return (a) => (
          (a.request = new Request(e)),
          (a.params = { cacheKey: t, ...a.params }),
          this.precacheStrategy.handle(a)
        );
      }
      handleRequest({ request: e, event: t }) {
        let a,
          s = new URL(e.url, location.href);
        if (!s.protocol.startsWith('http')) return;
        let r = s.origin === location.origin,
          { params: n, route: i } = this.findMatchingRoute({
            event: t,
            request: e,
            sameOrigin: r,
            url: s,
          }),
          c = i?.handler,
          o = e.method;
        if ((!c && this._defaultHandlerMap.has(o) && (c = this._defaultHandlerMap.get(o)), !c))
          return;
        try {
          a = c.handle({ url: s, request: e, event: t, params: n });
        } catch (e) {
          a = Promise.reject(e);
        }
        let l = i?.catchHandler;
        return (
          a instanceof Promise &&
            (this._catchHandler || l) &&
            (a = a.catch(async (a) => {
              if (l)
                try {
                  return await l.handle({ url: s, request: e, event: t, params: n });
                } catch (e) {
                  e instanceof Error && (a = e);
                }
              if (this._catchHandler)
                return this._catchHandler.handle({ url: s, request: e, event: t });
              throw a;
            })),
          a
        );
      }
      findMatchingRoute({ url: e, sameOrigin: t, request: a, event: s }) {
        for (let r of this._routes.get(a.method) || []) {
          let n,
            i = r.match({ url: e, sameOrigin: t, request: a, event: s });
          if (i)
            return (
              (Array.isArray((n = i)) && 0 === n.length) ||
              (i.constructor === Object && 0 === Object.keys(i).length)
                ? (n = void 0)
                : 'boolean' == typeof i && (n = void 0),
              { route: r, params: n }
            );
        }
        return {};
      }
    }
    let ev = { rscPrefetch: 'pages-rsc-prefetch', rsc: 'pages-rsc', html: 'pages' },
      eq = [
        {
          matcher: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
          handler: new e_({
            cacheName: 'google-fonts-webfonts',
            plugins: [new eu({ maxEntries: 4, maxAgeSeconds: 31536e3, maxAgeFrom: 'last-used' })],
          }),
        },
        {
          matcher: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
          handler: new eb({
            cacheName: 'google-fonts-stylesheets',
            plugins: [new eu({ maxEntries: 4, maxAgeSeconds: 604800, maxAgeFrom: 'last-used' })],
          }),
        },
        {
          matcher: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
          handler: new eb({
            cacheName: 'static-font-assets',
            plugins: [new eu({ maxEntries: 4, maxAgeSeconds: 604800, maxAgeFrom: 'last-used' })],
          }),
        },
        {
          matcher: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
          handler: new eb({
            cacheName: 'static-image-assets',
            plugins: [new eu({ maxEntries: 64, maxAgeSeconds: 2592e3, maxAgeFrom: 'last-used' })],
          }),
        },
        {
          matcher: /\/_next\/static.+\.js$/i,
          handler: new e_({
            cacheName: 'next-static-js-assets',
            plugins: [new eu({ maxEntries: 64, maxAgeSeconds: 86400, maxAgeFrom: 'last-used' })],
          }),
        },
        {
          matcher: /\/_next\/image\?url=.+$/i,
          handler: new eb({
            cacheName: 'next-image',
            plugins: [new eu({ maxEntries: 64, maxAgeSeconds: 86400, maxAgeFrom: 'last-used' })],
          }),
        },
        {
          matcher: /\.(?:mp3|wav|ogg)$/i,
          handler: new e_({
            cacheName: 'static-audio-assets',
            plugins: [
              new eu({ maxEntries: 32, maxAgeSeconds: 86400, maxAgeFrom: 'last-used' }),
              new ey(),
            ],
          }),
        },
        {
          matcher: /\.(?:mp4|webm)$/i,
          handler: new e_({
            cacheName: 'static-video-assets',
            plugins: [
              new eu({ maxEntries: 32, maxAgeSeconds: 86400, maxAgeFrom: 'last-used' }),
              new ey(),
            ],
          }),
        },
        {
          matcher: /\.(?:js)$/i,
          handler: new eb({
            cacheName: 'static-js-assets',
            plugins: [new eu({ maxEntries: 48, maxAgeSeconds: 86400, maxAgeFrom: 'last-used' })],
          }),
        },
        {
          matcher: /\.(?:css|less)$/i,
          handler: new eb({
            cacheName: 'static-style-assets',
            plugins: [new eu({ maxEntries: 32, maxAgeSeconds: 86400, maxAgeFrom: 'last-used' })],
          }),
        },
        {
          matcher: /\/_next\/data\/.+\/.+\.json$/i,
          handler: new X({
            cacheName: 'next-data',
            plugins: [new eu({ maxEntries: 32, maxAgeSeconds: 86400, maxAgeFrom: 'last-used' })],
          }),
        },
        {
          matcher: /\.(?:json|xml|csv)$/i,
          handler: new X({
            cacheName: 'static-data-assets',
            plugins: [new eu({ maxEntries: 32, maxAgeSeconds: 86400, maxAgeFrom: 'last-used' })],
          }),
        },
        { matcher: /\/api\/auth\/.*/, handler: new Y({ networkTimeoutSeconds: 10 }) },
        {
          matcher: ({ sameOrigin: e, url: { pathname: t } }) => e && t.startsWith('/api/'),
          method: 'GET',
          handler: new X({
            cacheName: 'apis',
            plugins: [new eu({ maxEntries: 16, maxAgeSeconds: 86400, maxAgeFrom: 'last-used' })],
            networkTimeoutSeconds: 10,
          }),
        },
        {
          matcher: ({ request: e, url: { pathname: t }, sameOrigin: a }) =>
            '1' === e.headers.get('RSC') &&
            '1' === e.headers.get('Next-Router-Prefetch') &&
            a &&
            !t.startsWith('/api/'),
          handler: new X({
            cacheName: ev.rscPrefetch,
            plugins: [new eu({ maxEntries: 32, maxAgeSeconds: 86400 })],
          }),
        },
        {
          matcher: ({ request: e, url: { pathname: t }, sameOrigin: a }) =>
            '1' === e.headers.get('RSC') && a && !t.startsWith('/api/'),
          handler: new X({
            cacheName: ev.rsc,
            plugins: [new eu({ maxEntries: 32, maxAgeSeconds: 86400 })],
          }),
        },
        {
          matcher: ({ request: e, url: { pathname: t }, sameOrigin: a }) =>
            e.headers.get('Content-Type')?.includes('text/html') && a && !t.startsWith('/api/'),
          handler: new X({
            cacheName: ev.html,
            plugins: [new eu({ maxEntries: 32, maxAgeSeconds: 86400 })],
          }),
        },
        {
          matcher: ({ url: { pathname: e }, sameOrigin: t }) => t && !e.startsWith('/api/'),
          handler: new X({
            cacheName: 'others',
            plugins: [new eu({ maxEntries: 32, maxAgeSeconds: 86400 })],
          }),
        },
        {
          matcher: ({ sameOrigin: e }) => !e,
          handler: new X({
            cacheName: 'cross-origin',
            plugins: [new eu({ maxEntries: 32, maxAgeSeconds: 3600 })],
            networkTimeoutSeconds: 10,
          }),
        },
        { matcher: /.*/i, method: 'GET', handler: new Y() },
      ];
    new eE({
      precacheEntries: [
        { revision: null, url: '/_next/static/chunks/1052.365739066de1e610.js' },
        { revision: null, url: '/_next/static/chunks/1646.c682620e28b65092.js' },
        { revision: null, url: '/_next/static/chunks/206-37d5114db32913eb.js' },
        { revision: null, url: '/_next/static/chunks/2354-aa69997f28c78a99.js' },
        { revision: null, url: '/_next/static/chunks/2454-a4603973ddedafa1.js' },
        { revision: null, url: '/_next/static/chunks/2619-e81e97e6c03bcb3f.js' },
        { revision: null, url: '/_next/static/chunks/2651.e6036ea5317803be.js' },
        { revision: null, url: '/_next/static/chunks/3449.debabb2fd1b5007d.js' },
        { revision: null, url: '/_next/static/chunks/3521-58364629cfaed377.js' },
        { revision: null, url: '/_next/static/chunks/3850.7fd5998364b4b369.js' },
        { revision: null, url: '/_next/static/chunks/39-3f345f027aafd055.js' },
        { revision: null, url: '/_next/static/chunks/4476.5c8fb74f21768989.js' },
        { revision: null, url: '/_next/static/chunks/4766-a20a2932b799d259.js' },
        { revision: null, url: '/_next/static/chunks/4909-e4c6c6be4642cddb.js' },
        { revision: null, url: '/_next/static/chunks/4948.2e34dfc41361bfe4.js' },
        { revision: null, url: '/_next/static/chunks/4bd1b696-d36a35ab62861d24.js' },
        { revision: null, url: '/_next/static/chunks/5022-c2e17deb6f280367.js' },
        { revision: null, url: '/_next/static/chunks/508.bad9b4c22618e344.js' },
        { revision: null, url: '/_next/static/chunks/5139.c653a0999486dc7b.js' },
        { revision: null, url: '/_next/static/chunks/5239-86505d43d03e41ad.js' },
        { revision: null, url: '/_next/static/chunks/5572-754ea1680e51e1a5.js' },
        { revision: null, url: '/_next/static/chunks/5592-621387888cb69888.js' },
        { revision: null, url: '/_next/static/chunks/5804-cc6e30c27cd2fe3d.js' },
        { revision: null, url: '/_next/static/chunks/6001-f194fb0d7789dcc4.js' },
        { revision: null, url: '/_next/static/chunks/602dbae6-cab9304b5690b775.js' },
        { revision: null, url: '/_next/static/chunks/622.ba297999e6145777.js' },
        { revision: null, url: '/_next/static/chunks/6364-a7d68b00844d24a9.js' },
        { revision: null, url: '/_next/static/chunks/6586.fe6d33a7b5bf5d51.js' },
        { revision: null, url: '/_next/static/chunks/6640-abeb732fbae105d6.js' },
        { revision: null, url: '/_next/static/chunks/706-f4c86e348e6d63c8.js' },
        { revision: null, url: '/_next/static/chunks/7147-1d0739da6983c131.js' },
        { revision: null, url: '/_next/static/chunks/7260-83963acf5df7326f.js' },
        { revision: null, url: '/_next/static/chunks/7383.f65cc45fe5ee7b38.js' },
        { revision: null, url: '/_next/static/chunks/7768-915993cbc171d1f9.js' },
        { revision: null, url: '/_next/static/chunks/8408.633a4416476532ef.js' },
        { revision: null, url: '/_next/static/chunks/8864.ee8b520c1b759f14.js' },
        { revision: null, url: '/_next/static/chunks/8998-b2617046164e4a78.js' },
        { revision: null, url: '/_next/static/chunks/9146-5e485b124b17358f.js' },
        { revision: null, url: '/_next/static/chunks/9204-dadda4d43d04c692.js' },
        { revision: null, url: '/_next/static/chunks/9261-f32e54aece6b2320.js' },
        { revision: null, url: '/_next/static/chunks/9403-e627d6411df36039.js' },
        { revision: null, url: '/_next/static/chunks/9588-f0c0e22142790cde.js' },
        { revision: null, url: '/_next/static/chunks/9829-f3a3df403980d7a1.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/(account)/sign-in/page-4cc96b6343ef5125.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/(account)/sign-up/page-d0afb716c00c7172.js',
        },
        { revision: null, url: '/_next/static/chunks/app/(shop)/cart/page-b3ce81f0d703606d.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/(shop)/categories/page-1570aed696d1aca2.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/(shop)/checkout/page-299c8f78c3aa6e6f.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/(shop)/flash-sales/page-08e9843fb3bbf332.js',
        },
        { revision: null, url: '/_next/static/chunks/app/(shop)/kids/page-284e013717db1e51.js' },
        { revision: null, url: '/_next/static/chunks/app/(shop)/layout-021737706e8bf7bd.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/(shop)/men/clothing/page-b5747a8dfd8c82f1.js',
        },
        { revision: null, url: '/_next/static/chunks/app/(shop)/men/page-eafde3799ed66716.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/(shop)/men/shoes/page-f5c3a4a68c3eaf0d.js',
        },
        { revision: null, url: '/_next/static/chunks/app/(shop)/not-found-9bbf53e11b7eaf2d.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/(shop)/products/%5Bslug%5D/page-c0c1a47ceb1f76d4.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/(shop)/wishlist/page-ab663fb111083034.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/(shop)/women/clothing/page-914a2a2771cbf544.js',
        },
        { revision: null, url: '/_next/static/chunks/app/(shop)/women/page-43f4f15cb7ca5de2.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/(shop)/women/shoes/page-db4678a38c4bfa6c.js',
        },
        { revision: null, url: '/_next/static/chunks/app/_not-found/page-5f475234d8c05332.js' },
        { revision: null, url: '/_next/static/chunks/app/about/page-b15e477818e33833.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/account/change-password/page-f325a0bd702ea66d.js',
        },
        { revision: null, url: '/_next/static/chunks/app/account/redeem/page-ac6e4ab56f1a91d0.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/account/settings/page-6e086eada11b25b4.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/account/transactions/page-eed86cdf4f990404.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/account/vouchers/page-c13a7307e267a2bf.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/admin/audit-logs/page-46e935d425208fad.js',
        },
        { revision: null, url: '/_next/static/chunks/app/admin/banners/page-e3cb518afb629bd2.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/admin/categories/page-6f6e85f75bb56ce7.js',
        },
        { revision: null, url: '/_next/static/chunks/app/admin/contact/page-f7cf8a2081f8c53e.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/admin/dashboard/page-7d10da54afbfa70d.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/admin/faqs/categories/page-9e6d1086cf7091d2.js',
        },
        { revision: null, url: '/_next/static/chunks/app/admin/faqs/page-3e91fc4de2f71148.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/admin/flash-sales/%5Bid%5D/page-89bd6ad3c33105a2.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/admin/flash-sales/new/page-68c15c88e084e5b3.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/admin/flash-sales/page-3439c2bb555203aa.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/admin/gift-cards/new/page-5b5fabcc5bd68bec.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/admin/gift-cards/page-2ea562af2bbae5cd.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/admin/inventory/logs/page-73f05d732b2b3d99.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/admin/inventory/page-8dc73f5fdd6ad60f.js',
        },
        { revision: null, url: '/_next/static/chunks/app/admin/layout-a6f81652874928a0.js' },
        { revision: null, url: '/_next/static/chunks/app/admin/login/page-ffb827567b13ecec.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/admin/marketing/discounts/page-a083e5a2276effc4.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/admin/marketing/newsletter/page-f053465ea594d3f8.js',
        },
        { revision: null, url: '/_next/static/chunks/app/admin/media/page-5d4d2ea936874764.js' },
        { revision: null, url: '/_next/static/chunks/app/admin/menus/page-bf3cf00f7de31c53.js' },
        { revision: null, url: '/_next/static/chunks/app/admin/news/page-808c4e8b8edf8db3.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/admin/orders/%5Bid%5D/page-1c437e8ccf7942c8.js',
        },
        { revision: null, url: '/_next/static/chunks/app/admin/orders/page-4f50cd0cee23d467.js' },
        { revision: null, url: '/_next/static/chunks/app/admin/pages/page-e23c05884cefe56f.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/admin/products/%5Bid%5D/edit/page-ea2b00f71fc0aa57.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/admin/products/bulk/page-099294013f8f8d89.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/admin/products/new/page-6cd867aec40f0ccd.js',
        },
        { revision: null, url: '/_next/static/chunks/app/admin/products/page-6203d4939871e889.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/admin/refunds/%5Bid%5D/page-b9f23801a8058622.js',
        },
        { revision: null, url: '/_next/static/chunks/app/admin/refunds/page-62b7b3ce54e65f14.js' },
        { revision: null, url: '/_next/static/chunks/app/admin/reviews/page-dba8d94273f602c7.js' },
        { revision: null, url: '/_next/static/chunks/app/admin/security/page-b4ce0cc7cbbfca37.js' },
        { revision: null, url: '/_next/static/chunks/app/admin/seo/page-d5a775a9bce09d90.js' },
        { revision: null, url: '/_next/static/chunks/app/admin/settings/page-f4837f3ac77a6ce5.js' },
        { revision: null, url: '/_next/static/chunks/app/admin/staff/page-a37beecfe3eb10c1.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/admin/support/%5BchatId%5D/page-9a23733e4b16dc60.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/admin/support/layout-6e0af67d289645fe.js',
        },
        { revision: null, url: '/_next/static/chunks/app/admin/support/page-ffebb24795625e63.js' },
        { revision: null, url: '/_next/static/chunks/app/admin/users/page-b1d0d31da638ff2c.js' },
        { revision: null, url: '/_next/static/chunks/app/admin/vouchers/page-4cab907919b64275.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/admin/vouchers/personal-codes/page-3151c45ab783c8d3.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/admin/vouchers/promo-codes/page-14bee92243eda9ad.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/admin/warehouses/page-918f9da5f15e13f9.js',
        },
        { revision: null, url: '/_next/static/chunks/app/admin/wishlist/page-a6084f4d2662a9c7.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/account/change-password/route-b0a567ec22a3d8a0.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/account/consent/route-b5607228df004b79.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/account/delete/route-196ac13fedc26d6f.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/account/export/route-027c84d68eb017c8.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/account/sessions/route-1ab2eb7e85e4e4ea.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/account/transactions/export/route-c1ef862da86e597e.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/account/transactions/route-96b84090291ac212.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/account/update/route-fd3bad6c00299dfb.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/account/verify-password/route-ac243bdfa635a654.js',
        },
        { revision: null, url: '/_next/static/chunks/app/api/addresses/route-04bb09f23e84d5b7.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/analytics/profit/route-70fb6c7ed21bd4da.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/analytics/route-1dc6a572e7dac88e.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/attributes/route-bee3d7efbba44a3a.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/audit-logs/route-673424b30a9143d1.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/auth/2fa/setup/route-5623c103e65463d3.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/banners/route-d281d691c6f3d764.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/categories/%5Bid%5D/route-5f64178598441da5.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/categories/reorder/route-e8ed5ca598a2429c.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/categories/route-a23a23e89b05d674.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/cleanup-tokens/route-ef0c77023db41861.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/contact/%5Bid%5D/route-74c57f3fc980e9dc.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/contact/route-42a229b6f58ed5f0.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/customer-segments/route-8ed827b62e044bde.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/customers/%5BuserId%5D/notes/route-49391878f307256e.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/dashboard/route-327b63a677a39abb.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/faqs/categories/route-21ce52c50627b39a.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/faqs/route-d7a9e9cc2d71ee2c.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/flash-sales/%5Bid%5D/items/route-c52e2567e7ab47d2.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/flash-sales/%5Bid%5D/route-7c948c65a6ffd9aa.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/flash-sales/route-04bf304b3fee029b.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/gift-cards/%5Bid%5D/route-e7577f28ba69702a.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/gift-cards/%5Bid%5D/unlock/route-0d3ddcf6100896a4.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/gift-cards/route-5816b12cbc8c59ae.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/inventory/%5Bid%5D/route-c720f99d2cd6a710.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/inventory/alerts/route-cc24e76d8a01d66f.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/inventory/logs/route-172fb337ee23ae87.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/inventory/route-b8f3f452cac8818f.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/inventory/transfers/%5Bid%5D/route-29c81f88bd366e20.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/inventory/transfers/route-94c8f81ccd558060.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/marketing/bulk-discounts/route-bd5e46d2d58cab21.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/media/%5Bid%5D/route-dc871dd60c380ce6.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/media/route-e31041844241ca35.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/menus/route-5ee81d5a6d2dd72b.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/metrics/trigger/route-678f879eb48110ce.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/news/%5Bid%5D/route-1700dd4200592343.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/news/route-39de69bb2dd69ddc.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/newsletter/route-87c2c663ec145936.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/orders/%5Bid%5D/route-fd7e61e52fb41d85.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/orders/export/route-676bf212e60d1d53.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/orders/route-bf0d1dd24da4f43d.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/pages/route-61828379871eaf9a.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/products/%5Bid%5D/attributes/route-14de624bf5db9197.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/products/%5Bid%5D/route-f969d533e75dffc1.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/products/bulk/route-c349c55193c2bda5.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/products/route-44626280e99ab306.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/promo-codes/%5Bid%5D/route-16486046d88a9404.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/promo-codes/route-ccc3a72ef4a98c64.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/recommendations/sync/route-bd8b5c408c56179c.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/refunds/%5Bid%5D/route-84d1c553038c997a.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/refunds/route-afc8e6187c12d72d.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/reviews/%5Bid%5D/route-ae85b01662f3a55c.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/roles/route-97c3b65c23ca85db.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/search-analytics/route-5991a8e4e580e810.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/seo/files/route-8bd9f7d025b23642.js',
        },
        { revision: null, url: '/_next/static/chunks/app/api/admin/seo/route-db3d6bbe59537962.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/settings/route-ac395724ae931c16.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/shipments/route-aec26890a5dfbaae.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/staff/me/route-206e4e9382f4b1c1.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/staff/route-680d427d70bbb6f8.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/support/chats/%5BchatId%5D/route-aed875fe2ea6c165.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/support/chats/route-733a4ae72196ff9a.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/users/%5Bid%5D/route-47dc0aac278c7e50.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/users/export/route-34239e896c27f39a.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/users/route-b32c213f1a0c55ae.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/vouchers/route-b32f4fcd56d1cd8e.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/warehouses/%5Bid%5D/route-273440f785c29f92.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/warehouses/route-8a00b24d73797c68.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/admin/wishlist/route-c6ed2c85a1cdb4fd.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/auth/2fa/send/route-195b4e79ad6afd87.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/auth/2fa/toggle/route-27aaab2e8c6462c4.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/auth/2fa/verify-admin/route-7b4cb2a02dc80537.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/auth/2fa/verify/route-98acaa987d0adfd6.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/auth/admin/route-451568705d4adca8.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/auth/facebook/callback/route-4ab2704f6948cc5c.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/auth/facebook/route-a834b9a946227225.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/auth/forgot-password/route-dea9ed0fbb6e0a13.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/auth/google/callback/route-55faeb7c633d5372.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/auth/google/route-b8e085fff73123e1.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/auth/login-admin/route-d24c0950852e7896.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/auth/login/route-e3ddd1469d0b3535.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/auth/logout-all/route-25ad21c224b8cb77.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/auth/logout/route-91e0d02098f48a14.js',
        },
        { revision: null, url: '/_next/static/chunks/app/api/auth/me/route-c75e9ecf4c354f1e.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/auth/refresh/route-084af2aee0acecb5.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/auth/register/route-a715f786e5d53191.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/auth/reset-password/route-e8c215cf93e859dd.js',
        },
        { revision: null, url: '/_next/static/chunks/app/api/auth/user/route-f6d84740c38dc657.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/banners/click/route-b76ba1b60a2ca7f4.js',
        },
        { revision: null, url: '/_next/static/chunks/app/api/banners/route-827facf365a2ffd7.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/cart/%5Bid%5D/route-68b0d6557006f5ec.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/cart/check-balance/route-12921f2779563518.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/cart/release/route-859603f6a49c06dc.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/cart/reserve/route-cb8dfb72bf8388ad.js',
        },
        { revision: null, url: '/_next/static/chunks/app/api/cart/route-262f097ce9ea26b6.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/categories/route-4dd1bf4c5d485f50.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/chat/gemini/route-8297f537d46de8aa.js',
        },
        { revision: null, url: '/_next/static/chunks/app/api/contact/route-1ea82027f76831c4.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/cron/abandoned-cart/route-8fbf220f55261932.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/cron/cleanup-orders/route-39887ffc49d195c0.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/cron/cleanup-points/route-211ca9eb15491250.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/cron/cleanup-reservations/route-d88d62ba858bbd97.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/cron/daily-metrics/route-ed2d286ca6a97aae.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/cron/marketing-automation/route-2919c35946ba2d28.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/cron/wishlist-alerts/route-97c09a0a520bc9c9.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/debug/rbac/route-3dbd0a08a433b2e5.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/debug/sentry/route-1fb0c19b92dcbf77.js',
        },
        { revision: null, url: '/_next/static/chunks/app/api/faqs/route-9ff1802f731cb035.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/flash-sales/active/route-7e8c0059e0835f82.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/gift-cards/history/route-54ede42ed26c905a.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/gift-cards/verify/route-bc8e39f4e812eca2.js',
        },
        { revision: null, url: '/_next/static/chunks/app/api/health/route-9994b710a59e1ef8.js' },
        { revision: null, url: '/_next/static/chunks/app/api/init-db/route-1a6564f899e18ae5.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/maintenance-check/route-3b97a385b8e002ba.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/news/%5Bslug%5D/comments/likes/route-804f55a4800f61d0.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/news/%5Bslug%5D/comments/route-7fe29e8e6ab82ee9.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/news/%5Bslug%5D/route-ca07691a23119d15.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/news/author/%5Bid%5D/route-195ff4a22e766435.js',
        },
        { revision: null, url: '/_next/static/chunks/app/api/news/route-7b47163eb8bdc9c6.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/newsletter/route-67f952bac4dbe7e0.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/notifications/order-confirmation/route-7d13ecfb11aa2bfe.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/notifications/route-ca121c84c8e8375b.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/orders/%5BorderNumber%5D/route-559886cc9bc41ef8.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/orders/%5BorderNumber%5D/shipping/route-739827f364bfc866.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/orders/%5BorderNumber%5D/tracking/route-881d7041a97a8ab3.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/orders/lookup/route-c54d4fb67c4f0d52.js',
        },
        { revision: null, url: '/_next/static/chunks/app/api/orders/route-e6d976c7e9e7df68.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/payment/confirm/route-441f5c50cd2edcd7.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/payment/momo/create/route-1fb333efd948ae34.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/payment/momo/ipn/route-8e704cf0c4fd7bad.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/payment/vnpay/create_url/route-450dc5e1a6c6d433.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/payment/vnpay/ipn/route-86f64a1927e74566.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/payment/vnpay/return/route-fe46da576eea90f5.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/products/%5Bslug%5D/related/route-60945953909ba060.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/products/%5Bslug%5D/route-fffd223cc9e2f643.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/products/%5Bslug%5D/similar/route-cbe38d9693d0f71a.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/products/%5Bslug%5D/variants/route-ca4ac6a1055745ff.js',
        },
        { revision: null, url: '/_next/static/chunks/app/api/products/route-a5c37c3433199af0.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/products/search/route-54632a005c0690bd.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/promo-codes/available/route-c04e7960a05864d5.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/promo-codes/history/route-228c20004cd9ab4f.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/promo-codes/validate/route-6c28d1aa2cdb0a6d.js',
        },
        { revision: null, url: '/_next/static/chunks/app/api/refunds/route-b5ae8cc2a6bcfd6c.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/reviews/check-purchase/route-273f4f56f4537fa4.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/reviews/helpful/route-a6d93f0263d7a007.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/reviews/media/route-45d89e3c71af6adb.js',
        },
        { revision: null, url: '/_next/static/chunks/app/api/reviews/route-808976adb56c15b1.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/reviews/upload/route-f3dde569e7cbf860.js',
        },
        { revision: null, url: '/_next/static/chunks/app/api/settings/route-3ea2991450d81be3.js' },
        { revision: null, url: '/_next/static/chunks/app/api/site-data/route-8a8e7fe5845316b7.js' },
        { revision: null, url: '/_next/static/chunks/app/api/stores/route-f589867afffb4189.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/support/chat/%5BchatId%5D/close/route-f28709fc02485558.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/support/chat/%5BchatId%5D/messages/route-bae34a38d2fa737a.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/support/chat/%5BchatId%5D/read/route-3e3388ee01cc4d8e.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/support/chat/start/route-f9b365a096aa5f05.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/transactions/export/route-4aeb48898716825a.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/transactions/route-f10c21cf23fd4808.js',
        },
        { revision: null, url: '/_next/static/chunks/app/api/upload/route-b9bb8f49a55ac27e.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/user/redeem/route-0c99112658f6646a.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/user/vouchers/route-608c82adde85ef2e.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/api/webhooks/sepay/route-ad850f2dc49317c4.js',
        },
        { revision: null, url: '/_next/static/chunks/app/api/wishlist/route-952a60a0f11792a2.js' },
        { revision: null, url: '/_next/static/chunks/app/careers/page-cd33cd9d729b0e4e.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/category/%5Bslug%5D/page-093546e58e4ca88d.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/checkout/order-result/page-1ad883164dafa5dd.js',
        },
        { revision: null, url: '/_next/static/chunks/app/clothing/page-2a081fbd5d32ff90.js' },
        { revision: null, url: '/_next/static/chunks/app/compare/page-2fe339c5777cf729.js' },
        { revision: null, url: '/_next/static/chunks/app/csr/page-fa0e88c16563a1e2.js' },
        { revision: null, url: '/_next/static/chunks/app/error-116dc89384ea179b.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/forgot-password/page-14018738ded973f4.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/gift-card-balance/page-7796fa4bb8a29d6b.js',
        },
        { revision: null, url: '/_next/static/chunks/app/global-error-f73084e64d124ae1.js' },
        { revision: null, url: '/_next/static/chunks/app/guides/page-ed130a505c14e661.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/help/%5Bslug%5D/page-d73e11474ce47ce0.js',
        },
        { revision: null, url: '/_next/static/chunks/app/help/care/page-6b9dfbddad23ab94.js' },
        { revision: null, url: '/_next/static/chunks/app/help/contact/page-25a330c9963f89c3.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/help/order-cancellation/page-4f59d1ab17de540d.js',
        },
        { revision: null, url: '/_next/static/chunks/app/help/ordering/page-2008fac05a1bf79b.js' },
        { revision: null, url: '/_next/static/chunks/app/help/page-db4ac5284c3b8616.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/help/payment-options/page-0dec7f7041712594.js',
        },
        { revision: null, url: '/_next/static/chunks/app/help/returns/page-ac4938e74017772f.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/help/shipping-delivery/page-edd2a1b2d6c0ba7f.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/help/size-guide/page-da4496d6b83bdd90.js',
        },
        { revision: null, url: '/_next/static/chunks/app/investors/page-7a6965a645e33e03.js' },
        { revision: null, url: '/_next/static/chunks/app/layout-702a5313fc5b9a0d.js' },
        { revision: null, url: '/_next/static/chunks/app/maintenance/page-4429418d5c0143ca.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/news/%5Bslug%5D/page-1ddf01db75e34ab8.js',
        },
        {
          revision: null,
          url: '/_next/static/chunks/app/news/author/%5Bid%5D/page-c92d1be34d524c9f.js',
        },
        { revision: null, url: '/_next/static/chunks/app/news/page-d97c191fab772b7a.js' },
        { revision: null, url: '/_next/static/chunks/app/not-found-6d26a363363869ab.js' },
        { revision: null, url: '/_next/static/chunks/app/order-lookup/page-06b49a3c8c4b2b69.js' },
        { revision: null, url: '/_next/static/chunks/app/order-success/page-b0690f77c3c2362e.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/orders/%5BorderNumber%5D/page-8d2a02d547c723a0.js',
        },
        { revision: null, url: '/_next/static/chunks/app/orders/page-a24a98c975db9651.js' },
        { revision: null, url: '/_next/static/chunks/app/page-e49068882183db12.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/payment-confirmation/page-913d346ed0de872a.js',
        },
        { revision: null, url: '/_next/static/chunks/app/privacy-policy/page-00dcc49000dfa757.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/promo/birthday/layout-891fcdd6377b1171.js',
        },
        { revision: null, url: '/_next/static/chunks/app/promo/birthday/page-2efee2d94f6211a3.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/promo/student/layout-a431585dd53c6580.js',
        },
        { revision: null, url: '/_next/static/chunks/app/promo/student/page-a274cb0dd49e16ad.js' },
        {
          revision: null,
          url: '/_next/static/chunks/app/promo/teacher/layout-67b96f4798b788ab.js',
        },
        { revision: null, url: '/_next/static/chunks/app/promo/teacher/page-fa2144d2618696b1.js' },
        { revision: null, url: '/_next/static/chunks/app/purpose/page-f9a5bd3f2032c84a.js' },
        { revision: null, url: '/_next/static/chunks/app/reset-password/page-68ed6991e0ccedb1.js' },
        { revision: null, url: '/_next/static/chunks/app/robots.txt/route-427b1792b7d7ae7c.js' },
        { revision: null, url: '/_next/static/chunks/app/search/page-21eb26e09b164edd.js' },
        { revision: null, url: '/_next/static/chunks/app/shoes/page-0598b0a1413e5eb0.js' },
        { revision: null, url: '/_next/static/chunks/app/sitemap.xml/route-98e0ef6816975774.js' },
        { revision: null, url: '/_next/static/chunks/app/store/page-5325771d96075978.js' },
        { revision: null, url: '/_next/static/chunks/app/sustainability/page-4e6eae252550e144.js' },
        { revision: null, url: '/_next/static/chunks/app/terms-of-use/page-efadcbdc52343e50.js' },
        { revision: null, url: '/_next/static/chunks/app/terms/page-7b6cd585b14a13e3.js' },
        { revision: null, url: '/_next/static/chunks/app/vouchers/page-324d7543aabed374.js' },
        { revision: null, url: '/_next/static/chunks/framework-a8b15cf26ff61099.js' },
        { revision: null, url: '/_next/static/chunks/main-59cc69b6940643af.js' },
        { revision: null, url: '/_next/static/chunks/main-app-e7c66aab678b5eb7.js' },
        { revision: null, url: '/_next/static/chunks/pages/_app-1c76d82795463fdd.js' },
        { revision: null, url: '/_next/static/chunks/pages/_error-696741dc21464a1c.js' },
        {
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
        },
        { revision: null, url: '/_next/static/chunks/webpack-3329cbded894330f.js' },
        { revision: null, url: '/_next/static/css/7978894e5a6d0df0.css' },
        {
          revision: '2a1599531a0aad112b831be6969cbbfa',
          url: '/_next/static/wKaEwRFBvTnbG7g7ZtbEs/_buildManifest.js',
        },
        {
          revision: 'b6652df95db52feb4daf4eca35380933',
          url: '/_next/static/wKaEwRFBvTnbG7g7ZtbEs/_ssgManifest.js',
        },
        { revision: '02b01399b8dbe11a96254081108c712a', url: '/icons\\icon-192x192.png' },
        { revision: '02b01399b8dbe11a96254081108c712a', url: '/icons\\icon-512x512.png' },
        { revision: 'bc39dc5751918cfb6a5e460f36e85167', url: '/manifest.json' },
        { revision: '3ab2cd9d51a675d6b98aeddb80ec434f', url: '/manifest.webmanifest' },
        { revision: 'f51ee31c7bb464419db3bba59b0227a2', url: '/placeholder.png' },
        {
          revision: '297c175515d721cb3d2739d7b755b963',
          url: '/uploads\\reviews\\1771037986282-169b4f81-ecfc-4bc0-a01c-fd662bab8b02.png',
        },
        {
          revision: '20c996a849c3e843c8aa3625f8356afa',
          url: '/uploads\\reviews\\1771038672882-fda0c754-3c54-4052-9cdf-a34924747479.png',
        },
        {
          revision: '2eeed7e70a6e652c11fd30f97e8be739',
          url: '/uploads\\reviews\\review_3_1772365771897_1bk65q.png',
        },
        {
          revision: '2eeed7e70a6e652c11fd30f97e8be739',
          url: '/uploads\\reviews\\review_4_1772680921551_lrz3h.png',
        },
      ],
      skipWaiting: !0,
      clientsClaim: !0,
      navigationPreload: !0,
      runtimeCaching: eq,
    }).addEventListeners();
  })());
