# devops-lab-openshift

App Node mínima con CI/CD completo: **GitHub Actions → GHCR → Helm → OpenShift**.
Reproduce el flujo del equipo de Bélgica en Santander Consumer (allí: Amazon ECR; aquí: GHCR, que es gratis).

```
push a main ─► test (npm ci + npm test)
            ─► build (docker build, tag = commit SHA, push a ghcr.io)
            ─► deploy (oc login → helm upgrade --install --wait → smoke test)
pull request ─► test + build (sin push ni deploy)
```

## Estructura
| Ruta | Qué es |
|---|---|
| `src/` | App Express: `/`, `/health` (liveness), `/ready` (readiness) |
| `test/` | Tests con el runner nativo de Node (`node --test`) |
| `Dockerfile` | Multi-stage, puerto 8080, permisos para UID aleatorio de OpenShift |
| `helm/devops-lab-openshift/` | Deployment, Service, Route, ConfigMap |
| `.github/workflows/ci-cd.yml` | Pipeline CI/CD |

## Puesta en marcha

### 1. Probar en local (WSL)
```bash
npm ci && npm test
docker build -t devops-lab-openshift:local --build-arg APP_VERSION=local .
docker run --rm -p 8080:8080 devops-lab-openshift:local
curl localhost:8080/
```

### 2. Cluster OpenShift gratis
Red Hat Developer Sandbox: https://developers.redhat.com/developer-sandbox
Haz login con `oc` (botón "Copy login command" de la consola) y apunta tu namespace (`oc project` → algo tipo `<usuario>-dev`).

### 3. ServiceAccount para el pipeline (no uses tu token personal: caduca)
```bash
oc create serviceaccount github-deployer
oc policy add-role-to-user edit -z github-deployer

cat <<EOF | oc apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: github-deployer-token
  annotations:
    kubernetes.io/service-account.name: github-deployer
type: kubernetes.io/service-account-token
EOF

oc get secret github-deployer-token -o jsonpath='{.data.token}' | base64 -d; echo
oc whoami --show-server
```

### 4. Configurar GitHub (Settings → Secrets and variables → Actions)
| Tipo | Nombre | Valor |
|---|---|---|
| Secret | `OPENSHIFT_SERVER` | salida de `oc whoami --show-server` |
| Secret | `OPENSHIFT_TOKEN` | token de la ServiceAccount |
| Variable | `OPENSHIFT_NAMESPACE` | tu namespace (`oc project -q`) |

Crea también el environment `dev` (Settings → Environments).

### 5. Primer push y visibilidad de la imagen
Tras el primer build, el paquete en GHCR nace **privado** → OpenShift dará `ImagePullBackOff`.
Ve a tu perfil → Packages → `devops-lab-openshift` → Package settings → Change visibility → Public.
Relanza el workflow (Actions → Re-run jobs).

### 6. Verificar
```bash
oc get pods,svc,route -l app=devops-lab-openshift
curl https://$(oc get route devops-lab-openshift -o jsonpath='{.spec.host}')/
helm history devops-lab-openshift
```
