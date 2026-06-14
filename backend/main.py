# # import psycopg2
# # import csv
# # import os

# # # ── Change these ──────────────────────────────────────────
# # HOST     = "localhost"
# # PORT     = 5432
# # DB       = "nexus_db"
# # USER     = "nexus_user"
# # PASSWORD = "Nobody@#$123"
# # OUT_DIR  = r"C:\Users\david\Portfolio\nexus_tables"   # already exists
# # # ─────────────────────────────────────────────────────────

# # tables = [
# #     'accounts_branch','accounts_department','accounts_organisation','accounts_user',
# #     'accounts_user_groups','accounts_user_user_permissions','accounts_usersession',
# #     'attendance_attendancerecord','attendance_geofenceviolation','attendance_leaverequest',
# #     'auth_group','auth_group_permissions','auth_permission','background_task',
# #     'background_task_completedtask','certificates_badge','certificates_certificate',
# #     'core_auditlog','django_admin_log','django_content_type','django_migrations',
# #     'django_session','equipment_checkoutrequest','equipment_equipmentcategory',
# #     'equipment_equipmentitem','equipment_maintenancelog','feedback_feedbackticket',
# #     'filetransfer_filetransfer','fm_report_emergencyalert',
# #     'fm_report_emergencyalert_acknowledged_by','fm_report_fmheartbeat',
# #     'fm_report_fmoutage','fm_report_fmstation','news_editorialcomment',
# #     'news_newscategory','news_newsstory','news_newsstoryversion','news_radiofrequency',
# #     'news_radioshow','news_radioslot','news_seatallocation','news_seatrequest',
# #     'news_softwaresubscription','notifications_notification',
# #     'notifications_notificationpreference','tasks_achievementbadge',
# #     'tasks_certificate','tasks_deadlineextensionrequest','tasks_evaluation',
# #     'tasks_evaluationtemplate','tasks_logbook','tasks_logbookentry','tasks_task',
# #     'token_blacklist_blacklistedtoken','token_blacklist_outstandingtoken',
# #     'videography_footage','videography_shootbooking',
# #     'videography_shootbooking_equipment_list','wifi_wifigrant'
# # ]

# # os.makedirs(OUT_DIR, exist_ok=True)
# # conn = psycopg2.connect(host=HOST, port=PORT, dbname=DB, user=USER, password=PASSWORD)

# # for table in tables:
# #     filepath = os.path.join(OUT_DIR, f"{table}.csv")
# #     with conn.cursor() as cur:
# #         with open(filepath, "w", newline="", encoding="utf-8") as f:
# #             cur.copy_expert(f'COPY "{table}" TO STDOUT CSV HEADER', f)
# #     print(f"✓ {table}.csv")

# # conn.close()
# # print("\nAll done! CSVs saved to", OUT_DIR)

# from apps.accounts.models import User, Organisation, Branch, Department

# # Create organisation first
# org = Organisation.objects.create(
#     name="Swahilipot Institution",
#     code="BMI",
#     sector="broadcast"
# )

# # Create superuser / admin
# User.objects.create_superuser(
#     email="admin@nexus.system",
#     password="Admin@1234567",
#     first_name="System",
#     last_name="Admin",
#     organisation=org,
#     role="system_admin"
# )

# # Broadcast admin
# User.objects.create_user(
#     email="jane@nexus.system",
#     password="Admin@1234567",
#     first_name="Jane",
#     last_name="Muthoni",
#     organisation=org,
#     role="broadcast_admin"
# )

# # Attachee
# User.objects.create_user(
#     email="grace@nexus.system",
#     password="Admin@1234567",
#     first_name="Grace",
#     last_name="Wanjiku",
#     organisation=org,
#     role="attachee"
# )

# # Presenter
# User.objects.create_user(
#     email="david@nexus.system",
#     password="Admin@1234567",
#     first_name="David",
#     last_name="Mwangi",
#     organisation=org,
#     role="presenter"
# )

# exit()
from openrouter import OpenRouter
import os

with OpenRouter(api_key=os.getenv("OPENROUTER_API_KEY")) as client:
    response = client.chat.send(
        model="~openai/gpt-latest",
        messages=[
            {"role": "user", "content": "What is the meaning of life?"}
        ],
    )

    print(response.choices[0].message.content)
