"""Exercise release/rollback state without Docker or production credentials."""
import os
from pathlib import Path
import subprocess
import tempfile

source = Path(__file__).with_name("deploy.sh").read_text()
with tempfile.TemporaryDirectory(prefix="coremint-deploy-test-") as directory:
    root = Path(directory)
    (root / "bin").mkdir()
    docker = root / "bin/docker"
    docker.write_text('''#!/bin/bash
printf '%s %s\\n' "$APP_VERSION" "$*" >> "$TEST_LOG"
case "$*" in
 *'ps -q app'*) echo test-container;;
 *'inspect --format'*) echo "$TEST_HEALTH";;
 *'image ls'*) printf '%s\\n' "$OLD_IMAGE" "$OLDER_IMAGE";;
esac
''')
    docker.chmod(0o755)
    script = root / "deploy.sh"
    script.write_text(source.replace("cd /opt/coremintcrm", f"cd {root}")
                      .replace("/run/lock/coremintcrm-deploy.lock", str(root / "lock"))
                      .replace("flock -w 900 9", ":")
                      .replace("sleep 3", "sleep 0"))
    old, older, new = "1" * 40, "2" * 40, "3" * 40
    env = os.environ | {"PATH": str(root / "bin") + ":" + os.environ["PATH"],
                        "TEST_LOG": str(root / "log"), "OLD_IMAGE": old,
                        "OLDER_IMAGE": older}
    for state in ["healthy", "unhealthy"]:
        (root / "current-version").write_text(old + "\n")
        (root / "previous-version").write_text(older + "\n")
        (root / "log").write_text("")
        result = subprocess.run(["bash", str(script), new], input="test-token\n",
                                text=True, capture_output=True,
                                env=env | {"TEST_HEALTH": state})
        log = (root / "log").read_text()
        if state == "healthy":
            assert result.returncode == 0, result.stderr
            assert (root / "current-version").read_text().strip() == new
            assert (root / "previous-version").read_text().strip() == old
            assert f"retained_versions={new},{old}" in result.stdout
            assert f"image rm ghcr.io/hellen923/startboom_system-crm:{older}" in log
            assert f"image rm ghcr.io/hellen923/startboom_system-crm:{old}" not in log
        else:
            assert result.returncode == 1, result.stderr
            assert (root / "current-version").read_text().strip() == old
            assert f"{old} compose" in log
            assert "image rm" not in log
        print(f"{state}: release state and retention passed")
