FROM amazonlinux:2.0.20200722.0
RUN yum install -y python37 && \
    yum install -y python3-pip && \
    yum install -y zip && \
    yum clean all
RUN python3.7 -m pip install --upgrade pip && \
    python3.7 -m pip install virtualenv
COPY requirements.txt /
RUN python3.7 -m venv lambdalayer && \
    source lambdalayer/bin/activate && \
    pip install -r requirements.txt -t ./python && \
    deactivate && \
    zip -r python.zip ./python/


