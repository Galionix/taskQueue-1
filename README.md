# Taskqueue

General purpose task queue for automation tasks.
Works with IPC inter process communication.

so the basic idea:

we create tasks, assign them to schedule, activate schedule.

when schedule active, we look on dependencies of tasks that needs to be persistent.

for example for module that checks something