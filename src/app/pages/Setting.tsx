"use client";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import Button from "../_components/Button";

export default function NotificationSettingPage() {
  const [notificationDays, setNotificationDays] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // ユーザー情報取得（例: ログインユーザーのID取得）
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("ユーザー情報の取得に失敗しました");
        setLoading(false);
        return;
      }
      // notification_days取得
      const { data, error: dbError } = await supabase
        .from("users")
        .select("notification_days")
        .eq("id", user.id)
        .single();
      if (dbError || !data) {
        setError("通知日数の取得に失敗しました");
      } else {
        setNotificationDays(data.notification_days ?? 1);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSave = async () => {
  setSaving(true);
  setError(null);
  setSuccess(null);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setError("ユーザー情報の取得に失敗しました");
      setSaving(false);
      return;
    }
    const { error: dbError } = await supabase
      .from("users")
      .update({ notification_days: notificationDays })
      .eq("id", user.id);
    if (dbError) {
      setError("通知日数の更新に失敗しました");
    } else {
      setSuccess("更新完了しました");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4">通知日数の設定</h1>
      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <>
          <label className="block mb-2 font-medium">通知日数（1～30日）</label>
          <input
            type="number"
            min={1}
            max={30}
            value={notificationDays}
            onChange={e => {
              const val = Math.max(1, Math.min(30, Number(e.target.value)));
              setNotificationDays(val);
            }}
            className="border rounded px-2 py-1 w-full mb-4"
          />
          <Button
            onClick={handleSave}
            disabled={saving}
            variant="primary"
            size="md"
          >
            {saving ? "保存中..." : "保存"}
          </Button>
          {error && <p className="text-red-500 mt-2">{error}</p>}
          {success && <p className="text-green-600 mt-2">{success}</p>}
        </>
      )}
    </div>
  );
}
